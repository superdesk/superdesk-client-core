import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import createEditorStore, {getAnnotationsForStorage} from 'core/editor3/store';
import {ContentState, RawDraftContentState} from 'draft-js';
import {noop} from 'lodash';
import {IArticle} from 'superdesk-api';
import {IEditor3Config} from './interfaces';

interface IDerivedProperties {
    stringValue: string; // HTML or plain text (depending on config)
    annotations: Array<any>;
}

export function computeDerivedProperties(
    rawContentState: RawDraftContentState,
    config: IEditor3Config,
    article: IArticle,
): IDerivedProperties {
    const contentState: ContentState = createEditorStore(
        {
            editorState: rawContentState,
            onChange: noop,
            language: article.language,
        },
        null,
        true,
    ).getState().editorState.getCurrentContent();

    const generatedValue = (() => {
        if (config.singleLine) {
            return contentState.getPlainText();
        } else {
            return editor3StateToHtml(contentState);
        }
    })();

    const storageValue: IDerivedProperties = {
        stringValue: generatedValue,
        annotations: getAnnotationsForStorage(contentState),
    };

    return storageValue;
}
