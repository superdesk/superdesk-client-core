import {getSelectSingleValue} from './select_single_value';
import {fetchAllPages} from 'core/helpers/fetch-all-pages';

export const ContentFilterSingleValue = getSelectSingleValue(
    () => fetchAllPages('content_filters', {field: 'name', direction: 'ascending'})
        .then((items) => items.map(({_id, name}) => ({id: _id, label: name}))),
);
