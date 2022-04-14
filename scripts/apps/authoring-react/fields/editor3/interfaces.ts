import {Store} from 'redux';
import {IEditorStore} from 'core/editor3/store';
import {ContentState, RawDraftContentState} from 'draft-js';
import {RICH_FORMATTING_OPTION, ICommonFieldConfig} from 'superdesk-api';

export interface IEditor3ValueOperational {
    store: Store<IEditorStore>;
    contentState: ContentState;
}

export interface IEditor3ValueStorage {
    rawContentState: RawDraftContentState;
}

export interface IEditor3Config extends ICommonFieldConfig {
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    minLength?: number;
    maxLength?: number;
    singleLine?: boolean; // also limits to plain text
    cleanPastedHtml?: boolean;
    disallowedCharacters?: Array<string>;

    /**
     * Value - field ID of editor3 field.
     *
     * When this field is toggled on, it will initialize with a value
     * copied from a field with ID specified in this config.
     *
     * Only plaintext value is copied to avoid target field containing
     * invalid formatting options that may be valid in source field.
     */
    copyFromFieldOnToggle?: string;
}
