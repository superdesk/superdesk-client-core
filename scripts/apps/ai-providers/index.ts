import {reactToAngular1} from 'superdesk-ui-framework';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';
import {AiProvidersPage} from './AiProvidersPage';

const styles = 'display: flex; height: calc(100% - 48px)';

angular.module('superdesk.apps.ai-providers', [])
    .component('sdAiProviders', reactToAngular1(AiProvidersPage, [], [], styles))
    .config(['superdeskProvider', (superdeskProvider) => {
        superdeskProvider
            .activity('/settings/ai-providers', {
                label: gettext('AI Providers'),
                template: require('./views/settings.html'),
                category: superdeskProvider.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
                privileges: {ai_studio: 1},
            });
    }]);
