import {ICommonFieldConfig} from 'superdesk-api';

export interface IUrlObject {
    url: string;
    description: string;
}

export type IUrlsFieldValueOperational = Array<IUrlObject>;
export type IUrlsFieldValueStorage = IUrlsFieldValueOperational;
export type IUrlsFieldUserPreferences = never;
export type IUrlsFieldConfig = ICommonFieldConfig;
