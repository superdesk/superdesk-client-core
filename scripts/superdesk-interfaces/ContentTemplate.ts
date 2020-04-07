import {IBaseRestApiResponse, IDesk} from 'superdesk-api';

export interface IContentTemplate extends IBaseRestApiResponse {
    template_name?: string;
    data?: any;
    user?: string;
    is_public?: boolean;
    template_type?: 'create' | 'kill';
    next_run?: any;
    schedule?: any;
    template_desks?: Array<IDesk['_id']>;
}
