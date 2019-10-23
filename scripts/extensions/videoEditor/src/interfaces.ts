import { IArticle } from 'superdesk-api';
import { Crop } from 'react-image-crop';

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
    crop: Crop;
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