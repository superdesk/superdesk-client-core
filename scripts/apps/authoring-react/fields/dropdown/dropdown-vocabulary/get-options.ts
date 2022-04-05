import {authoringStorage} from 'apps/authoring-react/data-layer';
import {arrayToTree} from 'core/helpers/tree';
import {ITreeWithLookup} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {getVocabularyItemNameTranslated} from 'core/utils';
import {keyBy} from 'lodash';
import {IVocabulary, IVocabularyItem} from 'superdesk-api';
import {IDropdownConfigVocabulary, IDropdownOption} from '..';

function getOptionsDefault(vocabularyId: IVocabulary['_id']): Array<IVocabularyItem> {
    return authoringStorage.getVocabularies().get(vocabularyId).items;
}

export function getOptions(
    config: IDropdownConfigVocabulary,
    getVocabularyOptions: (vocabularyId: IVocabulary['_id']) => Array<IVocabularyItem> = getOptionsDefault,
): ITreeWithLookup<IDropdownOption> {
    const options: Array<IDropdownOption> = getVocabularyOptions(config.vocabularyId).map(
        (item) => {
            const v: IDropdownOption = {id: item.qcode, label: getVocabularyItemNameTranslated(item)};

            if (item.parent != null) {
                v.parent = item.parent;
            }

            return v;
        },
    );

    const tree: ITreeWithLookup<IDropdownOption> = {
        nodes: arrayToTree(
            options,
            ({id}) => id.toString(),
            ({parent}) => parent?.toString(),
        ).result,
        lookup: keyBy(options.map((opt) => ({value: opt})), (opt) => opt.value.toString()),
    };

    return tree;
}
