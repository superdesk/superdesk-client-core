import {authoringStorage} from 'apps/authoring-react/data-layer';
import {getVocabularyItemNameTranslated} from 'core/utils';
import {IVocabulary, IVocabularyItem} from 'superdesk-api';
import {IDropdownConfigVocabulary, IDropdownOption} from '..';

function getOptionsDefault(vocabularyId: IVocabulary['_id']): Array<IVocabularyItem> {
    return authoringStorage.getVocabularies().get(vocabularyId).items;
}

export function getOptions(
    config: IDropdownConfigVocabulary,
    getVocabularyOptions: (vocabularyId: IVocabulary['_id']) => Array<IVocabularyItem> = getOptionsDefault,
): Array<IDropdownOption> {
    return getVocabularyOptions(config.vocabularyId).map(
        (item) => ({id: item.qcode, label: getVocabularyItemNameTranslated(item)}),
    );
}
