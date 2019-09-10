
const HR_TEMPLATE = 'scripts/apps/workspace/views/workspace-sidenav-items-hr.html';
const DEFAULT_TEMPLATE = 'scripts/apps/workspace/views/workspace-sidenav-items-default.html';

WorkspaceSidenavDirective.$inject = ['superdeskFlags', 'Keys', 'config',
    '$rootScope', 'workspaces', 'privileges'];
export function WorkspaceSidenavDirective(superdeskFlags, Keys, config,
    $rootScope, workspaces, privileges) {
    return {
        template: require('../views/workspace-sidenav-items.html'),
        link: function(scope, elem) {
            scope.workspaceConfig = config.workspace || {}; // it's used in workspaceMenu.filter

            scope.getTemplateUrl = (item) => item.hr ? HR_TEMPLATE : (item.templateUrl || DEFAULT_TEMPLATE);

            // Filter extraItems based on privileges
            if (workspaces.extraItems) {
                scope.extraItems = workspaces.extraItems.filter((item) => privileges.userHasPrivileges(item.privilege));
            } else {
                scope.extraItems = [];
            }

            /*
             * Function for showing and hiding monitoring list
             * while authoring view is opened.
             *
             * @param {boolean} state Gets the state of button
             * @param {object} e Gets $event from the element
             */
            scope.hideMonitoring = function(state, e) {
                if (superdeskFlags.flags.authoring && state) {
                    e.preventDefault();
                    superdeskFlags.flags.hideMonitoring = !superdeskFlags.flags.hideMonitoring;
                } else {
                    superdeskFlags.flags.hideMonitoring = false;
                }
            };

            /*
             * By using keyboard shortcuts, change the current showed view
             *
             */
            scope.highlightsHotkey = function() {
                const ddlhighlights = elem.find('.highlights-dropdown .dropdown__toggle');

                if (ddlhighlights.length > 0) {
                    ddlhighlights.first().click();
                    elem.find('.dropdown__menu button')[0].focus();
                }
            };

            elem.on('keydown', function WorkspaceKeyboard(event) {
                if (event.which === Keys.up) {
                    elem.find('.dropdown__menu button:focus')
                        .parent('li')
                        .prev()
                        .children('button')
                        .focus();

                    return false;
                }

                if (event.which === Keys.down) {
                    elem.find('.dropdown__menu button:focus')
                        .parent('li')
                        .next()
                        .children('button')
                        .focus();

                    return false;
                }
            });

            if ($rootScope.popup) {
                superdeskFlags.flags.hideMonitoring = true;
            }
        },
    };
}
