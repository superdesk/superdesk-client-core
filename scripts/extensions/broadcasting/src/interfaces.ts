import {IBaseRestApiResponse} from 'superdesk-api';

export interface IShowBase {
    name: string;
    description: string;
    duration: number; // TODO: rename to planned_duration
}

export type IShow = IShowBase & IBaseRestApiResponse;
