import {IVocabulary} from 'superdesk-api';
import ng from 'core/services/ng';
import {sdApi} from 'api';

export function getCustomFieldVocabularies(): Array<IVocabulary> {
    const allVocabularies: Array<IVocabulary> = ng.get('vocabularies').getAllVocabulariesSync();

    return allVocabularies.filter((vocabulary) => sdApi.vocabularies.isCustomFieldVocabulary(vocabulary));
}

export function getLanguageVocabulary(): IVocabulary {
    const allVocabularies: Array<IVocabulary> = ng.get('vocabularies').getAllVocabulariesSync();

    return allVocabularies.find((x) => x._id === 'languages');
}

export function getCustomVocabulary(): Array<IVocabulary> {
    const allVocabularies: Array<IVocabulary> = ng.get('vocabularies').getAllVocabulariesSync();

    return allVocabularies.filter((vocabulary) => sdApi.vocabularies.isCustomVocabulary(vocabulary));
}
