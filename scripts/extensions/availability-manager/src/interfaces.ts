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
    // IDefaultAvailability['_id'] stores IUser['_id']

    user: IUser['_id'],
    enabled: boolean;
    working_days: {
        sunday?: IScheduleRecord;
        monday?: IScheduleRecord;
        tuesday?: IScheduleRecord;
        wednesday?: IScheduleRecord;
        thursday?: IScheduleRecord;
        friday?: IScheduleRecord;
        saturday?: IScheduleRecord;
    };
    language: Array<string>;
    tags: Array<{code: string}>;
}

interface IAvailabilityRecordReadOnly {
    readonly user: IUser['_id'];
    readonly last_updated_by?: IUser['_id'];
    readonly language?: Array<string>;
}

export type IWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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

    // undefined means status is not filtered, null - items are filtered where status is not set
    // in either case - filtering is front-end only
    status: {code: string} | undefined | null;

    tags: Array<{code: string}>;
}

export type IFilterPeriod = 'day' | 'week';
