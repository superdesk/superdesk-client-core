import {IArticle, ICommonFieldConfig} from 'superdesk-api';

export type IMediaValueOperational = Array<IArticle>;
export type IMediaValueStorage = IMediaValueOperational;
export type IMediaUserPreferences = never;

export interface IMediaConfig extends ICommonFieldConfig {
    maxItems?: number;
    allowPicture?: boolean;
    allowVideo?: boolean;
    allowAudio?: boolean;
    showPictureCrops?: boolean;
    showTitleEditingInput?: boolean;
}
