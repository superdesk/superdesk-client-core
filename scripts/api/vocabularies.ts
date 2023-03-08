import {OrderedMap} from 'immutable';
import ng from 'core/services/ng';
import {IArticle, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {getVocabularyItemNameTranslated} from 'core/utils';

function getAll(): OrderedMap<IVocabulary['_id'], IVocabulary> {
    return OrderedMap<string, IVocabulary>(
        ng.get('vocabularies').getAllVocabulariesSync().map(
            (vocabulary) => [vocabulary._id, vocabulary],
        ),
    );
}

function isCustomFieldVocabulary(vocabulary: IVocabulary): boolean {
    return vocabulary.field_type != null || vocabulary.custom_field_type != null;
}

function getVocabularyItemLabel(term: IVocabularyItem, item: IArticle): string {
    if (!term) {
        return 'None';
    }

    // Item can be anything here. It might be an article object or search filters object
    // depending where the function is called from.
    // It's checked if language is a string in order not to confuse it when language
    // is an array when called from global search filters.
    const language = typeof item.language === 'string' ? item.language : undefined;

    return getVocabularyItemNameTranslated(term, language);
}

const vocabularyItemsToString = (
    array: Array<IVocabularyItem>,
    propertyName?: keyof IVocabularyItem,
    schemeName?: string,
): string =>
    getVocabularyItemsByPropertyName(array, propertyName, schemeName).join(', ');

const getVocabularyItemsByPropertyName = (
    array: Array<IVocabularyItem>,
    propertyName?: keyof IVocabularyItem,
    schemeName?: string,
): Array<string> => {
    let subjectMerged = [];

    array.forEach((item) => {
        const value = propertyName == null ? item : item[propertyName];

        if (value) {
            subjectMerged.push(value);

            if ((schemeName?.length ?? 0) && item.scheme !== schemeName) {
                subjectMerged.pop();
            }
        }
    });

    return subjectMerged;
};

const getVocabularyItemsPreview = (
    array: Array<IVocabularyItem>,
    propertyName?: keyof IVocabularyItem,
    schemeName?: string,
    returnArray?: boolean,
): Array<string> | string => {
    if (returnArray) {
        return getVocabularyItemsByPropertyName(array, propertyName, schemeName);
    } else {
        return vocabularyItemsToString(array, propertyName, schemeName);
    }
};

/**
 * Selection vocabularies may be configured to be included in content profiles.
 */
function isSelectionVocabulary(vocabulary: IVocabulary): boolean {
    return !isCustomFieldVocabulary(vocabulary) && (
        vocabulary.selection_type === 'multi selection'
        || vocabulary.selection_type === 'single selection'
    );
}

interface IVocabulariesApi {
    getAll: () => OrderedMap<IVocabulary['_id'], IVocabulary>;
    isCustomFieldVocabulary:(vocabulary: IVocabulary) => boolean;
    isSelectionVocabulary: (vocabulary: IVocabulary) => boolean;
    getVocabularyItemLabel: (term: IVocabularyItem, item: IArticle) => string;
    getVocabularyItemsPreview: (
        array: Array<IVocabularyItem>,
        propertyName?: keyof IVocabularyItem,
        schemeName?: string,
        returnArray?: boolean
    ) => Array<string> | string;
    vocabularyItemsToString: (
        array: Array<IVocabularyItem>,
        propertyName?: keyof IVocabularyItem,
        schemeName?: string,
    ) => string;
}

export const vocabularies: IVocabulariesApi = {
    getAll,
    isCustomFieldVocabulary,
    isSelectionVocabulary,
    getVocabularyItemLabel,
    getVocabularyItemsPreview,
    vocabularyItemsToString,
};
