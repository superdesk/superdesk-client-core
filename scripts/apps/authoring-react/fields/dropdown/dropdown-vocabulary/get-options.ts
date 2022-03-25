import {authoringStorage} from 'apps/authoring-react/data-layer';
import {getVocabularyItemNameTranslated} from 'core/utils';
import {IVocabulary} from 'superdesk-api';
import {IDropdownConfigVocabulary, IDropdownOption} from '..';

export function getOptions(config: IDropdownConfigVocabulary) {
    const vocabulary: IVocabulary = authoringStorage.getVocabularies().get(config.vocabularyId);
    const options: Array<IDropdownOption> = vocabulary.items.map(
        (item) => ({id: item.qcode, label: getVocabularyItemNameTranslated(item)}),
    );

    return options;
}
