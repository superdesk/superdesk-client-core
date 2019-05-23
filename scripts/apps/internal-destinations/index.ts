import {reactToAngular1} from 'superdesk-ui-framework';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';
import {InternalDestinations} from './InternalDestinations';

const styles = 'display: flex; height: calc(100% - 48px)';

angular.module('superdesk.apps.internal-destinations', [])
    .component('sdInternalDestinations', reactToAngular1(InternalDestinations, [], [], styles))
    .config(['superdeskProvider', (superdeskProvider) => {
        superdeskProvider
            .activity('/settings/internal-destinations', {
                label: gettext('Internal Destinations'),
                template: require('./views/settings.html'),
                controllerAs: 'dest',
                category: superdeskProvider.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_FLOW,
                privileges: {publish: 1},
            });
    }]);
