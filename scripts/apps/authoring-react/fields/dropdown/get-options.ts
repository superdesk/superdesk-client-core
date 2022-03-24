import {IVocabulary} from 'superdesk-api';
import {authoringStorage} from 'apps/authoring-react/data-layer';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IDropdownConfig, IDropdownOption} from '.';
import {getVocabularyItemNameTranslated} from 'core/utils';

export function getOptions(config: IDropdownConfig): Array<IDropdownOption> {
    if (config.source === 'manual-entry') {
        return config.options;
    } else if (config.source === 'vocabulary') {
        const vocabulary: IVocabulary = authoringStorage.getVocabularies().get(config.vocabularyId);
        const options: Array<IDropdownOption> = vocabulary.items.map(
            (item) => ({id: item.qcode, label: getVocabularyItemNameTranslated(item)}),
        );

        return options;
    } else if (config.source === 'remote-source') {
        throw new Error('Will not be called in case remote sources are used');
    } else {
        assertNever(config);
    }
}
