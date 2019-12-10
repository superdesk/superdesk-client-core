import {gettext} from 'core/utils';
import {IActivity} from 'superdesk-interfaces/Activity';

export interface IAuthoringMenuGroup {
    _id: string;
    label?: string;
    concate?: boolean;
    actions?: Array<IActivity>;
}

/**
 * Menu groups for authoring
 */
export const AUTHORING_MENU_GROUPS: Array<IAuthoringMenuGroup> = [
    {_id: 'default', label: gettext('Actions')},
    {_id: 'duplicate', label: gettext('Duplicate'), concate: true},
    {_id: 'packaging'},
    {_id: 'highlights'},
    {_id: 'corrections'},
];
