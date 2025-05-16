import {IBaseRestApiResponse, IUser} from 'superdesk-api';

export interface IWorkingHours {
    start_time: string; // ISO 8601
    end_time: string; // ISO 8601
    tags: Array<{code: string}>;
}


export type IAvailabilityAllDay = {
    date: string;
    status: 'available' | 'unavailable';
    working_hours?: [{tags: Array<{code: string}>}];
}

export type IAvailabilityPartial = {
    date: string;
    status: 'partial';
    working_hours?: Array<IWorkingHours>;
}

export type IAvailabilityRecordTemplate = IAvailabilityAllDay | IAvailabilityPartial;

export type IScheduleRecord = Omit<IAvailabilityAllDay, 'date'> | Omit<IAvailabilityPartial, 'date'>;

export interface IDefaultAvailability extends IBaseRestApiResponse {
    working_days?: {
        sunday?: IScheduleRecord;
        monday?: IScheduleRecord;
        tuesday?: IScheduleRecord;
        wednesday?: IScheduleRecord;
        thursday?: IScheduleRecord;
        friday?: IScheduleRecord;
        saturday?: IScheduleRecord;
    };
    language?: Array<string>;
    tags?: Array<{code: string}>
}

interface IAvailabilityRecordReadOnly {
    readonly user: IUser['_id'];
    readonly language?: Array<string>;
}

export type IAvailabilityRecord = IAvailabilityRecordTemplate & IAvailabilityRecordReadOnly & IBaseRestApiResponse;

/**
 * Set contains IDs
 * Users will only be able to choose from vocabulary items in this set.
 * Or tags that are not in the set, but are already saved in the database.
 */
export type ITagsWhiteList = Set<string>;

export interface IFilters {
    language: Array<string>;
    date: Date;
    status: Array<{code: string}>;
    tags: Array<{code: string}>;
}

export type IFilterPeriod = 'day' | 'week';
