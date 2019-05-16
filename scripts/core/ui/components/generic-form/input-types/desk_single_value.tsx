import ng from 'core/services/ng';
import {getSelectSingleValue} from './select_single_value';
import {IDesk} from 'superdesk-interfaces/Desk';
import {IRestApiResponse} from 'superdesk-api';

export const DeskSingleValue = getSelectSingleValue(
    () =>
        ng.getService('api')
            .then((api) => api('desks').query({max_results: 200}))
            .then((contentFilters: IRestApiResponse<IDesk>) =>
                contentFilters._items.map(({_id, name}) => ({id: _id, label: name}))),
);
