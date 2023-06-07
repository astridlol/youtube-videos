import { Router } from 'itty-router';
import convert from 'xml-js';

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

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
	link: string;
	channel: Channel;
	title: string;
	published: Published;
}
const router = Router();

router.get('/:id', async ({ params }) => {
	const videos = await getChannelVideos(params.id);

	return new Response(JSON.stringify(videos, null, 4));
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

const parseVideo = (videoObj: VideoElement[]): VideoObject => {
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
	newObj.link = `https://youtu.be/watch?v=${newObj.id}`;
	newObj.title = getValue('title');
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
