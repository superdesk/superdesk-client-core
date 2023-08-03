import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import createEditorStore, {getAnnotationsForStorage} from 'core/editor3/store';
import {ContentState, RawDraftContentState} from 'draft-js';
import {noop} from 'lodash';
import {IEditor3Config, IEditor3Output} from 'superdesk-api';

export function computeEditor3Output(
    rawContentState: RawDraftContentState,
    config: IEditor3Config,
    language: string,
    planeTextInMultiLineMode?: boolean,
): IEditor3Output {
    const contentState: ContentState = createEditorStore(
        {
            editorState: rawContentState,
            onChange: noop,
            language: language,
        },
        null,
        true,
    ).getState().editorState.getCurrentContent();

    const generatedValue = (() => {
        if (config.singleLine || planeTextInMultiLineMode) {
            return contentState.getPlainText();
        } else {
            return editor3StateToHtml(contentState);
        }
    })();

    const storageValue: IEditor3Output = {
        stringValue: generatedValue,
        annotations: getAnnotationsForStorage(contentState),
    };

    return storageValue;
}
