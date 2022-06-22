import {IBaseRestApiResponse} from 'superdesk-api';

export interface IShowBase {
    name: string;
    description: string;
    planned_duration: number | null;
}

export type IShow = IShowBase & IBaseRestApiResponse;

export interface IRundownTemplateBase {
    name: string;
    planned_duration: number; // seconds
    airtime_time: string; // ISO 8601 time
    airtime_date: string; // ISO 8601 date without timezone
    headline_template: {
        prefix: string;
        separator: string;
        date_format: string;
    };
}

export type IRundownTemplate = IRundownTemplateBase & IBaseRestApiResponse;
