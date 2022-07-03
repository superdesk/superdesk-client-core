import {getVocabularySelectionTypes} from 'apps/vocabularies/constants';
import {sdApi} from 'api';

export function isMultiple(vocabularyId) {
    const vocabulary = sdApi.vocabularies.getAll().get(vocabularyId);

    const isSingle = vocabulary.selection_type === getVocabularySelectionTypes().SINGLE_SELECTION.id;
    const _isMultiple = !isSingle;

    return _isMultiple;
}

/**
 * Should be eventually replaced by {@link isMultiple}.
 * This version was only added for compatibility with existing and possibly incorrect behavior.
 */
export function isMultipleV2(vocabularyId): boolean {
    const vocabulary = sdApi.vocabularies.getAll().get(vocabularyId);

    return vocabulary?.service?.all === 1;
}
