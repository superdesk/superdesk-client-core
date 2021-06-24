import {IDesk} from 'superdesk-api';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';

export const DeskSingleValue = getSelectSingleValueAutoComplete({
    query: (searchString: string) => dataApi.query<IDesk>(
        'desks',
        1,
        {field: 'name', direction: 'ascending'},
        (
            searchString.length > 0
                ? {
                    $or: [
                        {
                            name: {
                                $regex: searchString,
                                $options: '-i',
                            },
                        },
                    ],
                }
                : {}
        ),
        200,
    ),
    queryById: (id) => dataApi.findOne<IDesk>('desks', id),
    getPlaceholder: () => gettext('Select a desk'),
    getLabel: (item: IDesk) => item.name,
});
