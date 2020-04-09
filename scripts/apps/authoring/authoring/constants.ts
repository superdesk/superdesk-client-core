import {gettext} from 'core/utils';

interface IGroup {
    _id: string;
    label?: string;
    concate?: boolean;
    icon?: string;
}

/**
 * Menu groups for authoring
 */
export const AUTHORING_MENU_GROUPS: Array<IGroup> = [
    {_id: 'default', label: gettext('Actions')},
    {_id: 'duplicate', label: gettext('Duplicate'), concate: true, icon: 'copy'},
    {_id: 'packaging', icon: 'package-create'},
    {_id: 'highlights', icon: 'star'},
    {_id: 'corrections', label: gettext('Publishing actions'), concate: true},
];
