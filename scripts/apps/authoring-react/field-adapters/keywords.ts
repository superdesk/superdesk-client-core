import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IDropdownConfigVocabulary,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {TAG_INPUT_FIELD_ID} from '../fields/tag-input';

export function getKeywordsAdapter(): IFieldAdapter<IArticle> {
    const hasKeywordCV = sdApi.vocabularies.getAll().has('keywords');

    if (hasKeywordCV) {
        return {
            getFieldV2: () => {
                const fieldConfig: IDropdownConfigVocabulary = {
                    source: 'vocabulary',
                    vocabularyId: 'keywords',
                    multiple: true,
                };

                const fieldV2: IAuthoringFieldV2 = {
                    id: 'keywords',
                    name: gettext('Keywords'),
                    fieldType: 'dropdown',
                    fieldConfig,
                };

                return fieldV2;
            },
            retrieveStoredValue: (article) => {
                // Must be undefined (not null) when absent: the backend rejects keywords: null, and
                // generatePatch would emit it on a profile switch. Mirrors the non-vocabulary branch.
                return article.keywords ?? undefined;
            },
            storeValue: (val: Array<string>, article) => {
                return {
                    ...article,
                    keywords: val,
                };
            },
        };
    } else {
        return {
            getFieldV2: () => {
                const fieldV2: IAuthoringFieldV2 = {
                    id: 'keywords',
                    name: gettext('Keywords'),
                    fieldType: TAG_INPUT_FIELD_ID,
                    fieldConfig: {},
                };

                return fieldV2;
            },
            retrieveStoredValue: (article) => {
                return article.keywords;
            },
            storeValue: (val: Array<string>, article) => {
                return {
                    ...article,
                    keywords: val,
                };
            },
        };
    }
}
