import {IBaseRestApiResponse} from 'superdesk-api';
import {IDestination} from './Destination';

export interface ISubscriber extends IBaseRestApiResponse {
    name: string;
    api_products?: Array<unknown>;
    destinations?: Array<IDestination>;
    email?: string;
    global_filters?: {};
    is_active?: boolean;
    is_targetable?: boolean;
    products?: Array<unknown>;
    sequence_num_settings?: {
        min: number;
        max: number;
    };
    subscriber_type?: 'all' | string;
}
