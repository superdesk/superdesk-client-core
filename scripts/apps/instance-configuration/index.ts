import {gettext} from 'core/utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import {IBaseRestApiResponse, IUser} from 'superdesk-api';
import {InstanceConfigurationSettings} from './components/InstanceConfiguration';

export interface ISystemMessage extends IBaseRestApiResponse {
    type: 'warning' | 'alert' | 'primary' | 'success';
    is_active: boolean;
    message_title: string;
    message: string;
    user_id: IUser['_id'];
}

angular.module('superdesk.apps.instance-configuration', [
    'superdesk.core.activity',
])
    .component('sdInstanceConfigurationSettings', reactToAngular1(
        InstanceConfigurationSettings,
        [],
        [],
    ))

    .config(['superdeskProvider', function config(superdesk) {
        superdesk.activity('/settings/instance-configuration', {
            label: gettext('Instance configuration'),
            template: '<sd-instance-configuration-settings></sd-instance-configuration-settings>',
            category: superdesk.MENU_MAIN,
            priority: 1000,
            adminTools: true,
        });
    }]);
