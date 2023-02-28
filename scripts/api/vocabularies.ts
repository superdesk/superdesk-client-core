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

function getLocaleName(term: IVocabularyItem, item: IArticle): string {
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

/**
 * Selection vocabularies may be configured to be included in content profiles.
 */
function isSelectionVocabulary(vocabulary: IVocabulary) {
    return !isCustomFieldVocabulary(vocabulary) && (
        vocabulary.selection_type === 'multi selection'
        || vocabulary.selection_type === 'single selection'
    );
}

export const vocabularies = {
    getAll,
    isCustomFieldVocabulary,
    isSelectionVocabulary,
    getLocaleName,
};
