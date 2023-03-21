import {ICommonFieldConfig} from 'superdesk-api';

export type IValueOperational = string | null;
export type IValueStorage = IValueOperational;
export type IUserPreferences = never;

export interface IConfig extends ICommonFieldConfig {
    initial_offset_minutes: number;
    increment_steps: Array<number>;
}
