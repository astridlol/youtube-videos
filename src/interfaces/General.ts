export interface VideoElement {
    name: string;
    elements: any[];
}

export interface VideoObject {
    id: string;
    isShort: boolean;
    link: string;
    shortLink: string;
    channel: Channel;
    title: string;
    published: Published;
    thumbnail: string;
}

interface Channel {
    id: string;
    link: string;
    name: string;
}

interface Published {
    date: string;
    relative: string;
}
