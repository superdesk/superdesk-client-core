import {
    ICustomFieldType,
    IArticle,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {convertToRaw, ContentState} from 'draft-js';
import createEditorStore, {
    prepareEditor3StateForExport,
    getAnnotationsForField,
} from 'core/editor3/store';
import ng from 'core/services/ng';
import {noop} from 'lodash';
import {
    CharacterLimitUiBehavior,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {CONTENT_FIELDS_DEFAULTS} from 'apps/authoring/authoring/helpers';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import {IEditor3Value, IEditor3Config} from './interfaces';
import {Difference} from './difference';
import {Preview} from './preview';
import {Config} from './config';
import {Editor} from './editor';
import {replaceAllForEachBlock} from 'core/editor3/helpers/find-replace';

interface IUserPreferences {
    characterLimitMode?: CharacterLimitUiBehavior;
}

export function getEditor3Field(): ICustomFieldType<IEditor3Value, IEditor3Config, IUserPreferences> {
    const field: ICustomFieldType<IEditor3Value, IEditor3Config, IUserPreferences> = {
        id: 'editor3',
        label: gettext('Editor3 (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
        differenceComponent: Difference,
        configComponent: Config,

        retrieveStoredValue: (fieldId, article) => {
            const rawContentState = article.fields_meta?.[fieldId]?.['draftjsState'][0];

            const store = createEditorStore(
                {
                    editorState: rawContentState ?? convertToRaw(ContentState.createFromText('')),
                    onChange: noop,
                    language: article.language,
                },
                ng.get('spellcheck'),
                true,
            );

            return {
                store,
                contentState: store.getState().editorState.getCurrentContent(),
            };
        },

        storeValue: (fieldId, article, value, config) => {
            let contentState = prepareEditor3StateForExport(
                value.store.getState().editorState.getCurrentContent(),
            );

            // trim whitespace at the beginning of each block
            contentState = replaceAllForEachBlock(contentState, /^\s+/g, '');

            // trim whitespace at the end of each block
            contentState = replaceAllForEachBlock(contentState, /\s+$/g, '');

            // replace multiple spaces with a single space
            contentState = replaceAllForEachBlock(contentState, /\s\s+/g, ' ');

            const rawContentState = convertToRaw(contentState);

            const generatedValue = (() => {
                if (config.singleLine) {
                    return contentState.getPlainText();
                } else {
                    return editor3StateToHtml(contentState);
                }
            })();

            const annotations = getAnnotationsForField(article, fieldId);

            const articleUpdated: IArticle = {
                ...article,
                fields_meta: {
                    ...(article.fields_meta ?? {}),
                    [fieldId]: {
                        draftjsState: [rawContentState],
                    },
                },
            };

            if (annotations.length > 0) {
                articleUpdated.fields_meta[fieldId].annotations = annotations;
            }

            articleUpdated.extra = {
                ...(articleUpdated.extra ?? {}),
                [fieldId]: generatedValue,
            };

            // Keep compatibility with existing output format.
            if (fieldId === 'body_html') {
                articleUpdated.annotations = annotations;
            }

            return articleUpdated;
        },
    };

    return field;
}
