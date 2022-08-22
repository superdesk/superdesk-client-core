import {IBaseRestApiResponse, IUser} from 'superdesk-api';

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
}

export type IRundown = IRundownBase & IBaseRestApiResponse;
