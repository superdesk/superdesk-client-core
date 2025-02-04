import {getSelectSingleValue} from './select_single_value';
import {dataApi} from 'core/helpers/CrudManager';
import {IVocabulary} from 'superdesk-api';

export const VocabularySingleValue = getSelectSingleValue(
    (props) => dataApi.findOne<IVocabulary>('vocabularies', props.formField.component_parameters.vocabulary_id)
        .then((vocabulary) => vocabulary.items.map(({qcode, name}) => ({id: qcode, label: name}))),
);
