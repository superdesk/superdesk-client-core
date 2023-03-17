import {IArticle, IAuthoringFieldV2, IFieldAdapter, IDropdownConfigVocabulary} from 'superdesk-api';
import {sdApi} from 'api';
import {gettext} from 'core/utils';
import {storeEditor3ValueBase} from '.';
import {BODY_FOOTER_FIELD_ID} from './body_footer';
import {getContentStateFromHtml} from 'core/editor3/html/from-html';
import {convertToRaw} from 'draft-js';

export const FOOTERS_FIELD_ID = 'body_footer_value';

export function getHelplines(): IFieldAdapter<IArticle> {
    if ((sdApi.vocabularies.getAll().toArray().filter((v) => v._id === 'footers')?.length ?? 0) < 1) {
        return null;
    }

    return {
        getFieldV2: (fieldEditor, fieldSchema) => {
            const fieldConfig: IDropdownConfigVocabulary = {
                multiple: false,
                source: 'vocabulary',
                vocabularyId: 'footers',
            };

            const fieldV2: IAuthoringFieldV2 = {
                id: 'footer',
                name: gettext('Helplines/Contact Information (IN FOOTERS)'),
                fieldType: 'dropdown',
                fieldConfig,
            };

            return fieldV2;
        },

        retrieveStoredValue: (item: IArticle, authoringStorage) => {
            const values = (item.subject ?? [])
                .filter(({scheme}) => scheme === 'footers')
                .map(({qcode}) => {
                    return qcode;
                });

            return values[0];
        },

        storeValue: (value, article, config) => {
            const rawContentState = convertToRaw(getContentStateFromHtml(`<p>${article.body_footer}${value}</p>`));
            const result = storeEditor3ValueBase(
                BODY_FOOTER_FIELD_ID,
                article,
                {rawContentState},
                {
                    editorFormat: [],
                    minLength: 0,
                    maxLength: 100,
                    cleanPastedHtml: true,
                    singleLine: false,
                    disallowedCharacters: [],
                },
            );
            const articleUpdated = {...result.article};

            articleUpdated.body_footer = result.stringValue;

            return articleUpdated;
        },
    };
}
