import {IBaseRestApiResponse} from 'superdesk-api';

export interface IVocabularyTag {
    text: string;
}

export interface IVocabulary extends IBaseRestApiResponse {
    _deleted: boolean;
    display_name: string;
    helper_text?: string;
    popup_width?: number;
    type: string;
    items: Array<{ name: string; qcode: string; is_active: boolean }>;
    single_value?: boolean;
    schema_field?: string;
    dependent?: boolean;
    service: {};
    priority?: number;
    unique_field: string;
    schema: {};
    field_type:
        | 'text'
        | 'media'
        | 'date'
        | 'embed'
        | 'related_content'
        | 'custom';
    field_options?: { // Used for related content fields
        allowed_types?: any;
        allowed_workflows?: any;
        multiple_items?: { enabled: boolean; max_items: number };
    };
    init_version?: number;
    preffered_items?: boolean;
    tags?: Array<IVocabularyTag>;
    date_shortcuts?: Array<{ value: number; term: string; label: string }>;
    custom_field_type?: string;
    custom_field_config?: { [key: string]: any };
}
