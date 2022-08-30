import {RawDraftContentState} from 'draft-js';
import {IBaseRestApiResponse, IUser} from 'superdesk-api';

/**
 * Recurrence Rule
 * https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
 */
export interface IRRule {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    by_month?: Array<number>; // [1, 12]
    by_month_day?: Array<number>; // [-31, 31]
    by_day?: Array<number>; // [0, 6] ; 0 is Monday
    by_week_no?: Array<number>; // numbers from 1 to 52
}

export interface IShowBase {
    title: string;
    description: string;
    planned_duration: number | null;
}

export type IShow = IShowBase & IBaseRestApiResponse;

export interface IRundownTemplateBase {
    show: IShow['_id'];
    title: string;
    planned_duration: number; // seconds
    airtime_time: string; // ISO 8601 time
    airtime_date: string; // ISO 8601 date without timezone
    title_template: {
        prefix: string;
        separator: string;
        date_format: string;
    };
    created_by: IUser['_id'];
    updated_by: IUser['_id']; // TODO: rename to last_updated_by
    rundown_items: Array<IRundownItemBase>;
    repeat?: IRRule | null;
}

export type IRundownTemplate = IRundownTemplateBase & IBaseRestApiResponse;

export interface IRundownItemBase {
    item_type?: string;
    show_part?: string;
    start_time?: string;
    end_time?: string;
    duration: number;
    planned_duration: number;
    title: string;
    content?: string;
    live_sound?: string;
    guests?: string;
    additional_notes?: string;
    live_captions?: string;
    last_sentence?: string;
    fields_meta?: {
        [key: string]: {
            draftjsState?: [RawDraftContentState];
            annotations?: Array<any>;
        }
    };
}

export type IRundownItem = IRundownItemBase & IBaseRestApiResponse;

/**
 * Extending from "IBaseRestApiResponse" is for compatibility reasons.
 * Rundown item template will never be stored as a separate database record.
 */
export interface IRundownItemTemplate extends IBaseRestApiResponse {
    data: IRundownItemBase;
}

/**
 * All properties in data are optional
 */
export interface IRundownItemTemplateInitial extends IBaseRestApiResponse {
    data: Partial<IRundownItemBase>;
}

interface IRundownItemReference {
    _id: string;
}

interface IRundownBase extends Omit<IRundownTemplateBase, 'headline_template' | 'rundown_items'> {
    readonly planned_duration: number;
    readonly duration: number;
    title: string;
    items: Array<IRundownItemReference>;
    template: IRundownTemplate['_id'];
}

export type IRundown = IRundownBase & IBaseRestApiResponse;
