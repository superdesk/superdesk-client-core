import {IBaseRestApiResponse} from 'superdesk-api';

export interface IContentFilter extends IBaseRestApiResponse {
    name: string;
    content_filter: Array<{expression: {fc?: Array<string>, pf?: Array<string>}}>;
    is_global: boolean;
    is_archived_filter: boolean;
    api_block: boolean;
}
