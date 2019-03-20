import {reactToAngular1} from 'superdesk-ui-framework';

import {ContentService} from './services';
import * as directive from './directives';
import * as ctrl from './controllers';
import {coreMenuGroups} from 'core/activity/activity';
import {WidgetsConfig} from './components/WidgetsConfig';
import {gettext} from 'core/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.content
 * @name superdesk.apps.content
 * @packageName superdesk.apps
 * @description Superdesk content.
 */

angular.module('superdesk.apps.workspace.content', [
    'superdesk.core.api',
    'superdesk.core.menu',
    'superdesk.apps.archive',
    'superdesk.apps.templates',
    'superdesk.apps.packaging',
])
    .service('content', ContentService)

    .directive('sdContentCreate', directive.ContentCreateDirective)
    .directive('sdContentSchemaEditor', directive.ContentProfileSchemaEditor)
    .directive('sdItemProfile', directive.ItemProfileDirective)
    .directive('sdSortContentProfiles', directive.SortContentProfiles)

    .component('sdWidgetsConfig', reactToAngular1(WidgetsConfig, ['initialWidgetsConfig', 'onUpdate']))
    .component('sdSchemaEditorFieldsDropdown', {
        template: require('./views/schema-editor-fields-dropdown.html'),
        bindings: {
            bottom: '@',
            fields: '=',
            onSelect: '&',
        },
    })

    .controller('ContentProfilesController', ctrl.ContentProfilesController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/content-profiles', {
                label: gettext('Content Profiles'),
                controller: ctrl.ContentProfilesController,
                controllerAs: 'ctrl',
                templateUrl: 'scripts/apps/workspace/content/views/profile-settings.html',
                category: superdesk.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
                priority: 100,
                privileges: {content_type: 1},
            });
    }])
    .run(['keyboardManager', function(keyboardManager) {
        keyboardManager.register('General', 'ctrl + m', gettext('Create new item'));
    }]);
