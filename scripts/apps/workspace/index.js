// styles
import './content/styles/profiles.scss';

// scripts
import './content';
import {WorkspaceService} from './services';
import * as directive from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.workspaces
 * @name superdesk.apps.workspaces
 * @packageName superdesk.apps
 * @description Superdesk workspaces.
 */
angular.module('superdesk.apps.workspace', ['superdesk.apps.workspace.content'])
    .service('workspaces', WorkspaceService)

    .directive('sdDeskDropdown', directive.WorkspaceDropdownDirective)
    .directive('sdWorkspaceSidenav', directive.WorkspaceSidenavDirective)
    .directive('sdEditWorkspace', directive.EditWorkspaceDirective)

    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('General', 'ctrl + alt + b', gettext('Opens workspace / dashboard'));
        keyboardManager.register('General', 'alt + m', gettext('Opens monitoring'));
        keyboardManager.register('General', 'ctrl + alt + h', gettext('Opens highlights'));
        keyboardManager.register('General', 'alt + t', gettext('Opens tasks'));
        keyboardManager.register('General', 'ctrl + alt + k', gettext('Opens spike'));
        keyboardManager.register('General', 'alt + p', gettext('Opens personal'));
        keyboardManager.register('General', 'ctrl + alt + f', gettext('Opens search'));
        keyboardManager.register('General', 'x', gettext('Multi-selects(or deselects) an item'));
    }]);
