import {VideoElement, VideoObject} from "../interfaces/General";

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import checkForShort from "./checkShorts";
dayjs.extend(relativeTime)

export default async function parseVideo(videoObj: VideoElement[]): Promise<VideoObject> {
    /**
     * Gets the value of a key in the video object
     * @param key The key to get the value of
     * @returns The value of the key
     **/
    function getValue(key: string): string {
        const baseValue = videoObj.filter((obj) => obj.name === key)[0];

        if (typeof baseValue === 'undefined') return `${key} was undefined`;

        let text = baseValue.elements[0].text;
        if (!text) text = baseValue.elements[0].elements[0].text || baseValue.elements[0].elements[0].url;

        return text;
    };

    const newObj = {} as VideoObject;
    const published = getValue('published');

    const formatted = dayjs(published);

    newObj.id = getValue('yt:videoId');

    newObj.isShort = await checkForShort(newObj.id);
    newObj.shortLink = `https://youtu.be/watch?v=${newObj.id}`;
    newObj.link = `https://youtube.com/watch?v=${newObj.id}`;

    if (newObj.isShort) {
        newObj.shortLink = `https://youtube.com/shorts/${newObj.id}`;
    }

    newObj.title = getValue('title');
    newObj.thumbnail = `https://img.youtube.com/vi/${newObj.id}/maxresdefault.jpg`;
    newObj.channel = {
        id: getValue('yt:channelId'),
        link: `https://www.youtube.com/channel/${getValue('yt:channelId')}`,
        name: getValue('author'),
    };
    newObj.published = {
        date: published,
        relative: formatted.fromNow(),
    };

    return newObj;
};