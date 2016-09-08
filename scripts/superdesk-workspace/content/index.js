import { ContentService } from './services';
import * as directive from './directives';
import * as ctrl from './controllers';

angular.module('superdesk.workspace.content', [
    'superdesk.api',
    'superdesk.menu',
    'superdesk.archive',
    'superdesk.templates',
    'superdesk.packaging'
])
    .service('content', ContentService)

    .directive('sdContentCreate', directive.ContentCreateDirective)
    .directive('stringToArray', directive.StringToArrayDirective)
    .directive('sdContentSchemaEditor', directive.ContentProfileSchemaEditor)
    .directive('sdItemProfile', directive.ItemProfileDirective)

    .controller('ContentProfilesController', ctrl.ContentProfilesController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/content-profiles', {
                label: gettext('Content Profiles'),
                controller: ctrl.ContentProfilesController,
                controllerAs: 'ctrl',
                templateUrl: 'scripts/superdesk-workspace/content/views/profile-settings.html',
                category: superdesk.MENU_SETTINGS,
                priority: 100,
                privileges: {content_type: 1}
            });
    }])
    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('General', 'ctrl + m', gettext('Creates new item'));
    }]);
