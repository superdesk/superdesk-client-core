import {IDesk, IBaseRestApiResponse} from 'superdesk-api';

export interface IHighlight extends IBaseRestApiResponse {
    auto_insert: string;
    desks: Array<IDesk['_id']>;
    groups: Array<string>;
    name: string;
}
