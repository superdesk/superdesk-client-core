import {OrderedMap} from 'immutable';
import ng from 'core/services/ng';
import {IVocabulary} from 'superdesk-api';

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
};
