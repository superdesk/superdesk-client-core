import {ICommonFieldConfig} from 'superdesk-api';

export interface IEmbedValueOperational {
    embed: string; // embed code
    description: string;
}

export type IEmbedValueStorage = IEmbedValueOperational;
export type IEmbedUserPreferences = never;
export type IEmbedConfig = ICommonFieldConfig;
