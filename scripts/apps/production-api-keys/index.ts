import {reactToAngular1} from 'superdesk-ui-framework';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';
import {ProductionApiKeys} from './ProductionApiKeys';

const styles = 'display: flex; height: calc(100% - 48px)';

angular.module('superdesk.apps.production-api-keys', [])
    .component('sdProductionApiKeys', reactToAngular1(ProductionApiKeys, [], [], styles))
    .config(['superdeskProvider', (superdeskProvider) => {
        superdeskProvider
            .activity('/settings/production-api-keys', {
                label: gettext('Production API'),
                template: require('./views/settings.html'),
                category: superdeskProvider.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.WORKFLOW,
                priority: -400,
                privileges: {
                    auth_server_clients: 1,
                },
            });
    }]);
