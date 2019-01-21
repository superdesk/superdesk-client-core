// styles
import './content/styles/profiles.scss';

// scripts
import './content';
import {WorkspaceService} from './services';
import WorkspaceMenuProvider from './services/WorkspaceMenuProvider';
import * as directive from './directives';
import {gettext} from 'core/ui/components/utils';

angular.module('superdesk.apps.workspace.menu', [])
    .provider('workspaceMenu', WorkspaceMenuProvider);

/**
 * @ngdoc module
 * @module superdesk.apps.workspaces
 * @name superdesk.apps.workspaces
 * @packageName superdesk.apps
 * @description Superdesk workspaces.
 */
angular.module('superdesk.apps.workspace', [
    'superdesk.apps.workspace.content',
    'superdesk.apps.workspace.menu',
])
    .service('workspaces', WorkspaceService)

    .directive('sdDeskDropdown', directive.WorkspaceDropdownDirective)
    .directive('sdWorkspaceSidenav', directive.WorkspaceSidenavDirective)
    .directive('sdEditWorkspace', directive.EditWorkspaceDirective)

    .run(['keyboardManager', function(keyboardManager) {
        keyboardManager.register('General', 'ctrl + alt + b', gettext('Open workspace / dashboard'));
        keyboardManager.register('General', 'alt + m', gettext('Open monitoring'));
        keyboardManager.register('General', 'ctrl + alt + h', gettext('Open highlights'));
        keyboardManager.register('General', 'alt + t', gettext('Open tasks'));
        keyboardManager.register('General', 'ctrl + alt + k', gettext('Open spike'));
        keyboardManager.register('General', 'alt + p', gettext('Open personal'));
        keyboardManager.register('General', 'ctrl + alt + f', gettext('Open search'));
        keyboardManager.register('General', 'x', gettext('Multi-select (or deselect) an item'));
    }]);
