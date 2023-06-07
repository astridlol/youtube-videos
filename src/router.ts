import { Router } from 'itty-router';
import convert from 'xml-js';

// now let's create a router (note the lack of "new")
const router = Router();

// GET item
router.get('/:id', async ({ params }) => {
	const videos = await getChannelVideos(params.id);

	return new Response(JSON.stringify(videos, null, 4));
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

interface VideoElement {
	name: string;
	elements: any[];
}

interface VideoObject {
	videoId: string;
	videoLink: string;
	channelId: string;
	channelLink: string;
	channelName: string;
	videoTitle: string;
	videoPublished: string;
}

const parseVideo = (videoObj: VideoElement[]): VideoObject => {
	const getValue = (key: string): string => {
		const baseValue = videoObj.filter((obj) => obj.name === key)[0];
		if (typeof baseValue === 'undefined') return `${key} was undefined`;
		let text = baseValue.elements[0].text;
		if (!text) text = baseValue.elements[0].elements[0].text || baseValue.elements[0].elements[0].url;
		return text;
	};

	const newObj: VideoObject = {} as VideoObject;

	newObj.videoId = getValue('yt:videoId');
	newObj.videoLink = `https://youtu.be/watch?v=${newObj.videoId}`;
	newObj.channelId = getValue('yt:channelId');
	newObj.channelLink = `https://www.youtube.com/channel/${newObj.channelId}`;
	newObj.channelName = getValue('author');
	newObj.videoTitle = getValue('title');
	// TODO: Implement DayJS
	newObj.videoPublished = getValue('published');

	return newObj;
};

const getChannelVideos = async (channelId: string) => {
	const ytResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
		.then(async (r) => await r.text())
		.then((str) => JSON.parse(convert.xml2json(str)));

	const _videos = ytResponse.elements[0].elements.filter((obj: any) => obj.name === 'entry');

	const videos: VideoObject[] = [];

	_videos.forEach((v: any) => {
		const elm = v.elements;
		const parsed = parseVideo(elm);
		videos.push(parsed);
	});

	return {
		latest: videos.shift(),
		previous: videos,
	};
};

export default router;
