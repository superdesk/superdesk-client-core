import {ICommonFieldConfig} from 'superdesk-api';

export type IDateValueOperational = string;
export type IDateValueStorage = IDateValueOperational;
export type IDateUserPreferences = never;

export interface IDateShortcut {
    label: string;
    value: number;
    term: 'days' | 'weeks' | 'months' | 'years';
}

export interface IDateFieldConfig extends ICommonFieldConfig {
    shortcuts?: Array<IDateShortcut>;
}
