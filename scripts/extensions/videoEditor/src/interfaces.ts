import {IArticle} from 'superdesk-api';
import {Crop} from 'react-image-crop';

interface ICrop extends Crop{
    scale?: number;
    value?: number;
}

export interface IArticleVideo extends IArticle {
    renditions?: {
        original: {
            href: string;
            media: string;
            mimetype: string;
            version: number;
        };
        thumbnail: {
            href: string;
            mimetype: string;
        };
    };
    project?: object;
}

export interface IVideoEditor {
    crop: ICrop;
    cropEnabled: boolean;
    quality: number;
    degree: number;
    playing: boolean;
}

export interface IThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface IDropdownLabel {
    onClick?: () => void;
    getText?: (text: string) => string;
    title?: string | undefined;
    disabled?: boolean;
    selectedItem?: string;
}
