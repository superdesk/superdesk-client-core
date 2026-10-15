import {gettext} from 'core/utils';
import {getSelectSingleValue} from './select-single-value';

export const YesNo = getSelectSingleValue(
    () => Promise.resolve([
        {id: 'true', label: gettext('Yes')},
        {id: 'false', label: gettext('No')},
    ]),
);
