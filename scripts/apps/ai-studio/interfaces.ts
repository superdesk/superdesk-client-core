import {IBaseRestApiResponse} from 'superdesk-api';

export type IAIActionType = 'suggestion' | 'summary' | 'rewrite' | 'translation';

export type IAIUserAction = 'apply' | 'copy';

export interface IAIActionParameters {
    temperature?: number;
    extra_instructions?: string | null;
    max_characters?: number | null;
    suggestions_count?: number;
}

export interface IAIAction extends IBaseRestApiResponse {
    name: string;
    action_type: IAIActionType;
    active: boolean;

    /** Built-in text field names or IDs of custom text fields */
    input_fields: Array<string>;
    output_field: string;

    /** Empty means every content profile */
    content_profiles: Array<string>;

    provider: string;

    /** Absent or `null` means the provider's `default_model` */
    model?: string | null;

    parameters: IAIActionParameters;
}

/** A create or update request body, which may set only some values and send cleared ones as `null` */
export type IAIActionPayload = Partial<Omit<IAIAction, 'parameters'>> & {parameters?: IAIActionParameters};

export interface IAIActionTypeOption {
    action_type: IAIActionType;
    user_actions: Array<IAIUserAction>;
    uses_suggestions_count: boolean;
}

/** Response of `GET /ai_actions/options` */
export interface IAIActionOptions {
    action_types: Array<IAIActionTypeOption>;
    built_in_text_fields: Array<string>;
}

/** The editable values of an action, with every empty value normalised to `null` */
export interface IAIActionDraft {
    name: string;
    active: boolean;
    content_profiles: Array<string>;
    input_fields: Array<string>;
    output_field: string | null;
    provider: string | null;
    model: string | null;
    max_characters: number | null;
    suggestions_count: number | null;
    extra_instructions: string | null;
}

export type IAIActionDraftField = keyof IAIActionDraft;

export type IAIActionDraftErrors = Partial<Record<IAIActionDraftField, string>>;

export interface ISelectOption {
    id: string;
    label: string;
}
