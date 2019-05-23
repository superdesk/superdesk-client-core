import {IDefaultApiFields} from 'types/RestApi';

export interface IContentFilter extends IDefaultApiFields {
    name: string;
    content_filter: Array<{expression: {fc?: Array<string>, pf?: Array<string>}}>;
    is_global: boolean;
    is_archived_filter: boolean;
    api_block: boolean;
}
