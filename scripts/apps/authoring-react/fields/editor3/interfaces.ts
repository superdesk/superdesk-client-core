import {Store} from 'redux';
import {IEditorStore} from 'core/editor3/store';
import {ContentState} from 'draft-js';
import {RICH_FORMATTING_OPTION, ICommonFieldConfig} from 'superdesk-api';

export interface IEditor3Value {
    store: Store<IEditorStore>;
    contentState: ContentState;
}

export interface IEditor3Config extends ICommonFieldConfig {
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    minLength?: number;
    maxLength?: number;
    singleLine?: boolean; // also limits to plain text
    cleanPastedHtml?: boolean;
}
