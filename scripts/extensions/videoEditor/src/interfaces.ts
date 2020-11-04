import {IArticle} from 'superdesk-api';

export interface IVideoProject {
    _etag: string;
    project: {
        url: string;
        thumbnails: {
            preview: {
                url: string;
            };
            timeline: Array<{
                url: string;
                width: number;
                height: number;
            }>;
        };
        processing: {
            video: boolean;
            thumbnail_preview: boolean;
            thumbnails_timeline: boolean;
        };
    };
    renditions: IArticle['renditions'];
}

export interface ICrop {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: 'px' | '%';
    aspect?: number;
}

export interface IThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface ITimelineThumbnail {
    processing: boolean;
    thumbnails: Array<IThumbnail> | [];
}

export interface IDropdownLabel {
    onClick?: () => void;
    gettext?: (text: string) => string;
    getClass?: (text: string) => string;
    title?: string | null;
    disabled?: boolean;
    selectedItem?: {
        label: string;
        value: number;
    };
}

export interface IErrorMessage {
    internal_error: number;
    _message: {
        crop: Array<string>;
        trim: Array<string>;
    };
    _status: 'ERR';
}
