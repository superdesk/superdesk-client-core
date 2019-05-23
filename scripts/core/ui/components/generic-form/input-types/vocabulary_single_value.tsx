import {getSelectSingleValue} from './select_single_value';
import ng from 'core/services/ng';

export const VocabularySingleValue = getSelectSingleValue(
    (props) => ng.getService('vocabularies')
        .then((vocabularies) => vocabularies.getVocabulary(props.formField.component_parameters.vocabulary_id))
        .then((vocabulary) => vocabulary.items.map(({qcode, name}) => ({id: qcode, label: name}))),
);
