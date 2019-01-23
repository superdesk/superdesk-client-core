export type VocabularyFieldType = 'text' | 'media' | 'date' | 'embed' | 'related_content';

export interface IVocabularyTag {
    text: string;
}

export interface IVocabulary {
    _id: string;
    display_name: string;
    helper_text: string;
    popup_width: number;
    type: string;
    items: Array<{name: string}>;
    single_value: boolean;
    schema_field: string;
    dependent: boolean;
    service: {};
    priority: number;
    unique_field: string;
    schema: {};
    field_type: VocabularyFieldType;
    field_options: {};
    init_version: number;
    preffered_items: boolean;
    tags: Array<IVocabularyTag>;
    date_shortcuts: Array<{value: number; term: string; label: string}>;
}
