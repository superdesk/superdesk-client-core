import {IBaseRestApiResponse} from 'superdesk-api';

export interface IInternalDestination extends IBaseRestApiResponse {
    name: string;
    is_active: boolean;
    filter?: string;
    desk: string;
    stage?: string;
    macro?: string;
}
