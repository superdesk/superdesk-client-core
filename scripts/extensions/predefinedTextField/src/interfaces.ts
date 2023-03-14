import {ICommonFieldConfig} from 'superdesk-api';

export type IValueOperational = string | null;
export type IValueStorage = IValueOperational;
export type IUserPreferences = never;

export interface IPredefinedFieldOption {
    _id: string;
    title: string;
    definition: string;
}

export interface IConfig extends ICommonFieldConfig {
    options?: Array<IPredefinedFieldOption>;
    allowSwitchingToFreeText?: boolean;
}

export interface IExtensionConfigurationOptions {
    placeholderMapping?: {[name: string]: string};
}
