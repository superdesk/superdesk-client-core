WorkspaceSidenavDirective.$inject = ['superdeskFlags', '$location', 'Keys', 'gettext', 'config',
    '$route', 'api', '$filter', '$rootScope'];
export function WorkspaceSidenavDirective(superdeskFlags, $location, Keys, gettext, config,
    $route, api, $filter, $rootScope) {
    return {
        templateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav-items.html',
        link: function(scope, elem) {

            scope.workspaceConfig = config.workspace || {};

            /*
             * Function for showing and hiding monitoring list
             * while authoring view is opened.
             *
             * @param {boolean} state Gets the state of button
             * @param {object} e Gets $event from the element
             */
            scope.hideMonitoring = function (state, e) {
                if (superdeskFlags.flags.authoring && state) {
                    e.preventDefault();
                    superdeskFlags.flags.hideMonitoring = !superdeskFlags.flags.hideMonitoring;
                } else {
                    superdeskFlags.flags.hideMonitoring = false;
                }
            };

            scope.loadScanpixSearch = function (source) {
                $location.url('/search?repo=' + source + '&q=subscription:(subscription)');
                $route.reload();
            };

            /*
             * Initialize the search providers
             */
            if ($rootScope.config && $rootScope.config.features && $rootScope.config.features.scanpixSearchShortcut) {
                api.search_providers.query({max_results: 200})
                    .then(function(result) {
                        scope.providers = $filter('sortByName')(result._items, 'search_provider');
                    });
            }

            /*
             * By using keyboard shortcuts, change the current showed view
             *
             */
            scope.highlightsHotkey = function () {
                elem.find('.highlights-dropdown .dropdown-toggle').click();
                elem.find('.dropdown-menu button')[0].focus();
            };

            elem.on('keydown', function WorkspaceKeyboard(event) {
                if (event.which === Keys.up) {
                    elem.find('.dropdown-menu button:focus').parent('li').prev().children('button').focus();
                    return false;
                }

                if (event.which === Keys.down) {
                    elem.find('.dropdown-menu button:focus').parent('li').next().children('button').focus();
                    return false;
                }
            });
        }
    };
}
