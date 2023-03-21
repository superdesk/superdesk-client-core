import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {sdApi} from 'api';

export const BODY_FOOTER_FIELD_ID = 'body_footer';
export const FOOTERS_VOCABULARY_ID = 'footers';

export const body_footer: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema, fieldExists) => {
        const footerExistsInContentProfile = fieldExists('footer');
        const vocabularyExists = sdApi.vocabularies.getAll().get(FOOTERS_VOCABULARY_ID)?._id != null;
        const addPredefinedSnippetsField = footerExistsInContentProfile && vocabularyExists;

        const fieldConfig: IEditor3Config = {
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: false,
            disallowedCharacters: [],
        };

        // If we don't have the predefined snippets
        if (addPredefinedSnippetsField) {
            fieldConfig.vocabularyId = FOOTERS_VOCABULARY_ID;
        }

        const fieldV2: IAuthoringFieldV2 = {
            id: BODY_FOOTER_FIELD_ID,
            name: addPredefinedSnippetsField
                ? gettext('Body footer / Helplines / Contact Information')
                : gettext('Body footer'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        BODY_FOOTER_FIELD_ID,
        item,
        authoringStorage,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            BODY_FOOTER_FIELD_ID,
            item,
            value,
            config,
        );
        const articleUpdated = {...result.article};

        articleUpdated.body_footer = result.stringValue;

        return articleUpdated;
    },
};
