import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config, IEditor3ValueStorage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {copyEmbeddedArticlesIntoAssociations} from '../copy-embedded-articles-into-associations';
import {editor3ToOperationalFormat} from '../fields/editor3';

export const body_html: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: false,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'body_html',
            name: gettext('Body HTML'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        'body_html',
        item,
        authoringStorage,
    ),

    storeValue: (value: IEditor3ValueStorage, item, config, preferIncomplete) => {
        if (preferIncomplete) {
            return {
                ...item,
                fields_meta: {
                    ...(item.fields_meta ?? {}),
                    body_html: {
                        draftjsState: [value.rawContentState],
                    },
                },
            };
        } else {
            const result = storeEditor3ValueBase(
                'body_html',
                item,
                value,
                config,
            );

            const articleUpdated = {...result.article};

            articleUpdated.body_html = result.stringValue;

            // Keep compatibility with existing output format.
            // (only applicable to body_html field)
            articleUpdated.annotations = result.annotations;

            const contentState = editor3ToOperationalFormat(value, item.language).contentState;

            copyEmbeddedArticlesIntoAssociations(contentState, articleUpdated);

            return articleUpdated;
        }
    },
};
