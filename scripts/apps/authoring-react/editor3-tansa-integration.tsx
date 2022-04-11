import {IContentProfileV2} from 'superdesk-api';
import {Map} from 'immutable';
import {getTansaHtml} from 'core/editor3/helpers/tansa';
import {setHtmlFromTansa} from 'core/editor3/actions';
import {IEditor3ValueOperational} from './fields/editor3/interfaces';

const TANSA_PROOFING_ATTRIBUTE = 'tansa-proofing';

export function runTansa(contentProfile: IContentProfileV2, fieldsData: Map<string, unknown>) {
    // Disable tansa for all text fields.
    Array.from(document.querySelectorAll(
        'input[type="text"], textarea, [contenteditable]',
    )).forEach((el) => {
        el.setAttribute(TANSA_PROOFING_ATTRIBUTE, 'false');
    });

    // Create an element exclusively for tansa
    const tansaEl = document.createElement('div');

    tansaEl.setAttribute('contenteditable', 'true');
    tansaEl.setAttribute(TANSA_PROOFING_ATTRIBUTE, 'true');

    const allFields = contentProfile.header.merge(contentProfile.content);
    const editor3Fields =
        allFields.filter((field) => field.fieldType === 'editor3').toArray();

    let textByField = Map<string, string>();

    for (const field of editor3Fields) {
        const {store} = fieldsData.get(field.id) as IEditor3ValueOperational;
        const editorState = store.getState().editorState;

        textByField = textByField.set(field.id, getTansaHtml(editorState));
    }

    tansaEl.innerHTML = textByField.map((value, key) => `<div data-field-id="${key}">${value}</div>`).join('');

    document.body.appendChild(tansaEl);

    window.afterProofing = () => {
        let result = Map<string, string>();

        for (const child of Array.from(tansaEl.children)) {
            const fieldId = child.getAttribute('data-field-id');

            if (fieldId != null) {
                result = result.set(fieldId, child.innerHTML);
            }
        }

        editor3Fields.forEach((field) => {
            const htmlAfter = result.get(field.id);

            if (htmlAfter != null) {
                const htmlBefore = textByField.get(field.id);

                if (htmlBefore !== htmlAfter) {
                    const {store} = fieldsData.get(field.id) as IEditor3ValueOperational;

                    store.dispatch(setHtmlFromTansa(htmlAfter, false));
                }
            }
        });

        tansaEl.remove();

        for (const elem of Array.from(document.querySelectorAll(`[${TANSA_PROOFING_ATTRIBUTE}]`))) {
            elem.removeAttribute(TANSA_PROOFING_ATTRIBUTE);
        }

        window.afterProofing = null;
    };

    window.RunTansaProofing();
}
