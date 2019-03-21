import {gettext} from 'core/utils';

/**
 * Menu groups for authoring
 */
export const AUTHORING_MENU_GROUPS = [
    {_id: 'default', label: gettext('Actions')},
    {_id: 'duplicate', label: gettext('Duplicate'), concate: true},
    {_id: 'packaging'},
    {_id: 'highlights'},
    {_id: 'corrections'},
];
