// styles
import './content/styles/profiles.less';

// scripts
import './content';
import { WorkspaceService } from './services';
import * as directive from './directives';

angular.module('superdesk.workspace', ['superdesk.workspace.content'])
    .service('workspaces', WorkspaceService)

    .directive('sdDeskDropdown', directive.WorkspaceDropdownDirective)
    .directive('sdWorkspaceSidenav', directive.WorkspaceSidenavDirective)
    .directive('sdEditWorkspace', directive.EditWorkspaceDirective)

    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('General', 'alt + h', gettext('Opens workspace'));
        keyboardManager.register('General', 'alt + m', gettext('Opens monitoring'));
        keyboardManager.register('General', 'alt + d', gettext('Opens highlights'));
        keyboardManager.register('General', 'alt + t', gettext('Opens tasks'));
        keyboardManager.register('General', 'alt + x', gettext('Opens spike'));
        keyboardManager.register('General', 'alt + p', gettext('Opens personal'));
        keyboardManager.register('General', 'alt + f', gettext('Opens search'));
    }]);
