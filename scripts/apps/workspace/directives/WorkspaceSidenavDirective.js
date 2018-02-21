
WorkspaceSidenavDirective.$inject = ['superdeskFlags', '$location', 'Keys', 'gettext', 'config',
    '$route', 'api', '$filter', '$rootScope', 'workspaces', 'privileges', 'searchProviderService'];
export function WorkspaceSidenavDirective(superdeskFlags, $location, Keys, gettext, config,
    $route, api, $filter, $rootScope, workspaces, privileges, searchProviderService) {
    return {
        templateUrl: 'scripts/apps/workspace/views/workspace-sidenav-items.html',
        link: function(scope, elem) {
            scope.workspaceConfig = config.workspace || {};


            searchProviderService.getAllowedProviderTypes().then((providerTypes) => {
                scope.providerLabels = searchProviderService.getProviderLabels(providerTypes);
            });


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

            scope.loadSearchShortcut = function(provider) {
                $location.url('/search?repo=' + (provider._id ? provider._id : provider.source));
                $route.reload();
            };

            /*
             * Initialize the search providers
             */
            if ($rootScope.config && $rootScope.config.features && $rootScope.config.features.searchShortcut) {
                api.search_providers.query({max_results: 200})
                    .then((result) => {
                        scope.providers = $filter('sortByName')(result._items, 'search_provider');
                    });
            }

            /*
             * By using keyboard shortcuts, change the current showed view
             *
             */
            scope.highlightsHotkey = function() {
                let ddlhighlights = elem.find('.highlights-dropdown .dropdown__toggle');

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
        }
    };
}
