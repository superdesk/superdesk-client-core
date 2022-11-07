import {RawDraftContentState} from 'draft-js';
import {IBaseRestApiResponse, ILockInfo, IUser, IVocabularyItem} from 'superdesk-api';

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
    items: Array<IRundownItemBase>;
    repeat: boolean;
    schedule?: IRRule | null;
    autocreate_before_seconds?: number;
}

export type IRundownTemplate = IRundownTemplateBase & IBaseRestApiResponse;

export interface IRundownItemBase {
    readonly rundown: IRundown['_id'];
    item_type?: string;
    show_part?: string;
    duration: number;
    status?: string;
    planned_duration: number;
    title: string;
    content?: string;
    additional_notes?: string;
    fields_meta?: {
        [key: string]: {
            draftjsState?: [RawDraftContentState];
            annotations?: Array<any>;
        }
    };
    subitems?: Array<IVocabularyItem['qcode']>;
}

export type IRundownItem = IRundownItemBase & IBaseRestApiResponse & ILockInfo;

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

interface IRundownBase extends Omit<IRundownTemplateBase, 'headline_template' | 'items'> {
    readonly duration: number;
    planned_duration: number;
    airtime_time: string; // ISO 8601 time
    airtime_date: string; // ISO 8601 date without timezone
    title: string;
    items: Array<IRundownItemReference>;
    template: IRundownTemplate['_id'];
    matching_items: Array<IRundownItem>;
}

export type IRundown = IRundownBase & ILockInfo & IBaseRestApiResponse;

export interface IRundownFilters {
    /**
     * Don't forget to update {@see AppliedFilters} and {@see FilteringInputs} when fields are added or removed.
     */

    show?: IShow['_id'] | null;
    airtime_time?: {
        gte?: string;
        lte?: string;
    };
    airtime_date?: {
        gte?: string;
        lte?: string;
    };
    duration?: {
        gte?: number;
        lte?: number;
    };
}

export interface IRundownExportOption extends IBaseRestApiResponse {
    name: string;
}

export interface IRundownExportResponse extends IBaseRestApiResponse {
    format: string;
    href: string;
    rundown: IRundown['_id'];
}
