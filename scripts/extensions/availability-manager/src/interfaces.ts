import {IBaseRestApiResponse} from 'superdesk-api';

export interface IWorkingHours {
    start_time: string; // ISO 8601
    end_time: string; // ISO 8601
    tags: Array<{code: string}>;
}

export interface IScheduleRecord {
    status: 'available' | 'unavailable' | 'partial';
    working_hours?: Array<IWorkingHours>;
}

export type IAvailabilityRecordTemplate = {
    date: string;
    status: 'available' | 'unavailable' | 'partial';
    working_hours?: Array<IWorkingHours>;
}

export type IAvailabilityRecord = IAvailabilityRecordTemplate & IBaseRestApiResponse;
