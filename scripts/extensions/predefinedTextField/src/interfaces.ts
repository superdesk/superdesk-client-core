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
    /**
     * authoring-angular - only string fields from extra are available
     * authoring-react - all string fields are available
     */
    placeholderMapping?: {[name: string]: string};
}
