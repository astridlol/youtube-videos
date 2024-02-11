import { Router } from 'itty-router';
import convert from 'xml-js';

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

async function checkForShort(id: string) {
	const shortsURL = `https://www.youtube.com/shorts/${id}`;

	try {
		const response = await fetch(shortsURL, { method: 'GET', redirect: 'follow' });
		return response.url === shortsURL;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}

interface VideoElement {
	name: string;
	elements: any[];
}

interface Published {
	date: string;
	relative: string;
}

interface Channel {
	id: string;
	link: string;
	name: string;
}

interface VideoObject {
	id: string;
	isShort: boolean;
	link: string;
	shortLink: string;
	channel: Channel;
	title: string;
	published: Published;
	thumbnail: string;
}
const router = Router();

router.get('/:id', async ({ params }) => {
	const videos = await getChannelVideos(params.id);

	return Response.json(videos);
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

const parseVideo = async (videoObj: VideoElement[]): Promise<VideoObject> => {
	const getValue = (key: string): string => {
		const baseValue = videoObj.filter((obj) => obj.name === key)[0];
		if (typeof baseValue === 'undefined') return `${key} was undefined`;
		let text = baseValue.elements[0].text;
		if (!text) text = baseValue.elements[0].elements[0].text || baseValue.elements[0].elements[0].url;
		return text;
	};

	const newObj: VideoObject = {} as VideoObject;
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

const getChannelVideos = async (channelId: string) => {
	const ytResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
		.then(async (r) => await r.text())
		.then((str) => JSON.parse(convert.xml2json(str)));

	const _videos = ytResponse.elements[0].elements.filter((obj: any) => obj.name === 'entry');

	const videoPromises = _videos.map(async (v: any) => {
		const elm = v.elements;
		return await parseVideo(elm);
	});

	const videos = await Promise.all(videoPromises);

	return {
		latest: videos.shift(),
		previous: videos,
	};
};

export default router;
