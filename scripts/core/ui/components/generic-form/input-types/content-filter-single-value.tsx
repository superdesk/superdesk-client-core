import {getSelectSingleValue} from './select_single_value';
import {fetchAll} from 'core/helpers/fetch-all';

export const ContentFilterSingleValue = getSelectSingleValue(
    () => fetchAll('content_filters', {field: 'name', direction: 'ascending'})
        .then((items) => items.map(({_id, name}) => ({id: _id, label: name}))),
);
