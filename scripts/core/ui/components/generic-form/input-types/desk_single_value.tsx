import {IDesk} from 'superdesk-api';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';
import {gettext} from 'core/utils';

export const DeskSingleValue = getSelectSingleValueAutoComplete(
    'desks',
    {field: 'name', direction: 'ascending'},
    gettext('Select a desk'),
    (item: IDesk) => item.name,
);
