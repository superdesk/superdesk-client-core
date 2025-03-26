import {IBaseRestApiResponse} from 'superdesk-api';

export interface IWorkingHours {
    start_time: string;
    end_time: string;
    tags: Array<{code: string}>;
}

export interface IAvailabilityRecord extends IBaseRestApiResponse {
    date: string;
    status: 'available' | 'unavailable' | 'partial';
    working_hours?: Array<IWorkingHours>;
}