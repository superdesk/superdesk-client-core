import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {sdApi} from 'api';

export const BODY_FOOTER_FIELD_ID = 'body_footer';
export const FOOTERS_VOCABULARY_ID = 'footers';

export function getBodyFooter(): IFieldAdapter<IArticle> {
    return {
        getFieldV2: (fieldEditor, fieldSchema, fieldExists) => {
            const vocabularyExists =
                fieldExists('footer') && sdApi.vocabularies.getAll().get(FOOTERS_VOCABULARY_ID)?._id != null;

            const fieldConfig: IEditor3Config = {
                editorFormat: fieldEditor.formatOptions ?? [],
                minLength: fieldSchema?.minlength,
                maxLength: fieldSchema?.maxlength,
                cleanPastedHtml: fieldEditor?.cleanPastedHTML,
                singleLine: false,
                disallowedCharacters: [],
                vocabularyId: vocabularyExists ? 'footers' : undefined,
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: BODY_FOOTER_FIELD_ID,
                name: vocabularyExists
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
}
