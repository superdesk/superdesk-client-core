import { IArticle } from 'superdesk-api';

export interface IArticleVideo extends IArticle {
    renditions?: {
        original: {
            hef: string;
            media: string;
            mimetype: string;
            version: number;
        },
        thumbnail: {
            href: string,
            mimetype: string,
        }
    };
    project?: object;
}

export interface IVideoEditor {
    crop: {
        aspect: number,
        unit: string,
        x: number,
        y: number,
        width: number,
        height: number,
    };
    cropEnabled: boolean;
    quality: number;
    degree: number;
    playing: boolean;
}

export interface IThumbnail {
    url: string;
    width: number;
    height: number;
};