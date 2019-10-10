import { IArticle } from 'superdesk-api';

export interface IArticleVideo extends IArticle {
    renditions?: {
        original: {
            hef: string;
            media: string;
            mimetype: string;
            version: number;
        };
    };
    project?: object;
}

export interface IVideoEditor {
    crop: object;
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