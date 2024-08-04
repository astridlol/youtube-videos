import { xml2json } from 'xml-js';
import parseVideo from "./parseVideo";
import ky, {HTTPError} from 'ky';

export default async function getVideos(channelId: string) {
    let ytResponse: string;

    try {
        ytResponse = await ky.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`).text();
    } catch (error) {
        let err = error as unknown as HTTPError;

        if(err.response.status === 404) {
            return {
                error: `Channel ID provided is invalid!`,
                latest: null,
                previous: null,
            };
        }

        return {
            error: `Failed to fetch videos from YouTube!`,
            latest: null,
            previous: null,
        };
    }

    const parsedXML = xml2json(ytResponse)
    const jsonData =  JSON.parse(parsedXML)

    const videoData = jsonData.elements[0].elements.filter((obj: any) => obj.name === 'entry');

    const videoPromises = videoData.map(async (v: any) => {
        const elm = v.elements;
        return await parseVideo(elm);
    });

    const formattedVideos = await Promise.all(videoPromises);
    const latestVideo = formattedVideos.shift();

    return {
        latest: latestVideo,
        previous: formattedVideos,
    };
};