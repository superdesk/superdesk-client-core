import {reactToAngular1} from 'superdesk-ui-framework';

import {ContentService} from './services';
import * as directive from './directives';
import {coreMenuGroups} from 'core/activity/activity';
import {WidgetsConfig} from './components/WidgetsConfig';
import {gettext} from 'core/utils';
import ContentProfileFields from './controllers/ContentProfileFields';
import {ContentProfilesController} from './controllers/ContentProfilesController';
import {ContentProfileConfigNonText} from './components/ContentProfileConfigNonText';

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
    .component(
        'sdContentProfileConfigNonText',
        reactToAngular1(ContentProfileConfigNonText, ['profile', 'profileType']),
    )
    .component('sdSchemaEditorFieldsDropdown', {
        template: require('./views/schema-editor-fields-dropdown.html'),
        bindings: {
            bottom: '@',
            fields: '=',
            onSelect: '&',
        },
    })

    .controller('ContentProfilesController', ContentProfilesController)
    .controller('ContentProfileFields', ContentProfileFields)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/content-profiles', {
                label: gettext('Content Profiles'),
                controller: ContentProfilesController,
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
