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

export interface IDefaultAvailability extends IBaseRestApiResponse {
    working_days: {
        sunday: IScheduleRecord;
        monday: IScheduleRecord;
        tuesday: IScheduleRecord;
        wednesday: IScheduleRecord;
        thursday: IScheduleRecord;
        friday: IScheduleRecord;
        saturday: IScheduleRecord;
    };
    language?: Array<string>;
    tags?: Array<{code: string}>
}

export type IAvailabilityRecord = IAvailabilityRecordTemplate & IBaseRestApiResponse;

/**
 * Set contains IDs
 * Users will only be able to choose from vocabulary items in this set.
 * Or tags that are not in the set, but are already saved in the database.
 */
export type ITagsWhiteList = Set<string>;
