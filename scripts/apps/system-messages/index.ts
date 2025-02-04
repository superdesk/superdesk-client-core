import {gettext} from 'core/utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import {SystemMessagesSettingsComponent} from './components/system-messages-settings';
import {SystemMessagesComponent} from './components/system-messages';
import {IBaseRestApiResponse, IUser} from 'superdesk-api';

export interface ISystemMessage extends IBaseRestApiResponse {
    type: 'warning' | 'alert' | 'primary' | 'success';
    is_active: boolean;
    message_title: string;
    message: string;
    user_id: IUser['_id'];
}

export const RESOURCE = 'system_messages';

angular.module('superdesk.apps.system-messages', [
    'superdesk.core.activity',
])
    .component('sdSystemMessagesSettings', reactToAngular1(
        SystemMessagesSettingsComponent,
        [],
        [],
    ))

    .component('sdSystemMessages', reactToAngular1(
        SystemMessagesComponent,
        [],
        [],
    ))

    .config(['superdeskProvider', function config(superdesk) {
        superdesk.activity('/settings/system-messages', {
            label: gettext('System Message'),
            template: '<sd-system-messages-settings></sd-system-messages-settings>',
            category: superdesk.MENU_MAIN,
            priority: 1000,
            adminTools: true,
            privileges: {[RESOURCE]: 1},
        });
    }]);
