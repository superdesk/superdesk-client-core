import {gettext} from 'core/utils';

interface IGroup {
    _id: string;
    label?: string;
    concate?: boolean;
}

/**
 * Menu groups for authoring
 */
export const AUTHORING_MENU_GROUPS: Array<IGroup> = [
    {_id: 'default', label: gettext('Actions')},
    {_id: 'duplicate', label: gettext('Duplicate'), concate: true},
    {_id: 'packaging'},
    {_id: 'highlights'},
    {_id: 'corrections'},
];
