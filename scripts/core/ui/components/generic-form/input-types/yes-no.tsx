import {gettext} from 'core/utils';
import {getSelectSingleValue} from './select_single_value';

export const YesNo = getSelectSingleValue(
    () => Promise.resolve([
        {id: 'true', label: gettext('Yes')},
        {id: 'false', label: gettext('No')},
    ]),
);
