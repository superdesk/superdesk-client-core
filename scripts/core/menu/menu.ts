import {reactToAngular1} from 'superdesk-ui-framework';
import {GlobalMenuHorizontal} from './GlobalMenuHorizontal';
import {appConfig} from 'appConfig';

SuperdeskFlagsService.$inject = [];
function SuperdeskFlagsService() {
    this.flags = {
        menu: false,
        notifications: false,
    };

    angular.extend(this.flags, appConfig.ui);
}

/**
 * @ngdoc module
 * @module superdesk.core.menu
 * @name superdesk.core.menu
 * @packageName superdesk.core
 * @description The Superdesk menu module enables a configurable left-side menu.
 */
angular.module('superdesk.core.menu', [
    'superdesk.core.menu.notifications',
    'superdesk.core.privileges',
    'superdesk.core.services.asset',
    'superdesk.core.api',
])

    .service('superdeskFlags', SuperdeskFlagsService)
    .component(
        'sdGlobalMenuHorizontal',
        reactToAngular1(
            GlobalMenuHorizontal,
            [],
        ),
    )

    // set flags for other directives
    .directive('sdSuperdeskView', ['asset', function(asset) {
        SuperdeskViewController.$inject = ['superdeskFlags', 'superdesk', '$scope', '$route', 'session', '$timeout'];
        function SuperdeskViewController(superdeskFlags, superdesk, $scope, $route, session, $timeout) {
            $scope.session = session;

            this.flags = superdeskFlags.flags;

            $scope.$watch(function currentRoute() {
                return $route.current;
            }, (route) => {
                if (!route) {
                    return;
                }

                this.currentRoute = route;
                this.flags.workspace = !!route.sideTemplateUrl;
                this.flags.workqueue = this.flags.workqueue || true;
            });

            $scope.$watch(() => {
                return superdeskFlags.flags.hideMonitoring;
            }, () => {
                // Trigger resize event to update elements, 500ms delay is for animation
                $timeout(() => window.dispatchEvent(new Event('resize')), 500, false);
            });
        }

        return {
            templateUrl: asset.templateUrl('core/menu/views/superdesk-view.html'),
            controller: SuperdeskViewController,
            controllerAs: 'superdesk',
        };
    }])

    .directive('sdMenuWrapper', [
        '$route',
        'superdesk',
        'betaService',
        'userNotifications',
        'asset',
        'privileges',
        'lodash',
        'workspaceMenu',
        function(
            $route,
            superdesk,
            betaService,
            userNotifications,
            asset,
            privileges,
            _,
            workspaceMenu,
        ) {
            return {
                require: '^sdSuperdeskView',
                templateUrl: asset.templateUrl('core/menu/views/menu.html'),
                link: function(scope, elem, attrs, ctrl) {
                    scope.currentRoute = null;
                    scope.flags = ctrl.flags;
                    scope.menu = [];
                    scope.isTestEnvironment = appConfig.isTestEnvironment;
                    scope.environmentName = appConfig.environmentName;
                    scope.workspaceConfig = appConfig.workspace || {}; // it's used in workspaceMenu.filter

                    // menu items and groups - start
                    let group = null;

                    scope.items = [];

                    function setMenuItems() {
                        scope.items = [];

                        workspaceMenu
                            .filter((item) => !item.if || scope.$eval(item.if))
                            .forEach((item) => {
                                const itemGroup = item.group || group;

                                if (itemGroup !== group) {
                                    if (scope.items.length > 0) {
                                        // only put a separator if there's at least one item already in the list
                                        scope.items.push({hr: 1});
                                    }
                                    group = itemGroup;
                                }

                                scope.items.push(item);
                            });
                        // menu items and groups - end
                    }

                    /*
                        Marking item as active even if current path doesn't match exactly to item href path
                        For example, if current path is /a/b/c and there is only menu item for /a/b,
                        /a/b should be set active.
                    */
                    function getActiveMenuItemPath(currentPath: string) {
                        if (typeof currentPath !== 'string') {
                            return null;
                        }

                        const matchingUrls = scope.items
                            .filter((item) =>
                                typeof item.href === 'string'
                                && item.href.length > 0
                                && currentPath.startsWith(item.href),
                            )
                            .map((item) => item.href);

                        if (matchingUrls.length < 1) {
                            return null;
                        }

                        return matchingUrls.reduce((currentDeepest, current) => {
                            return currentDeepest.length < current.length
                                ? current
                                : currentDeepest;
                        });
                    }

                    scope.feedback_url = appConfig.feedback_url;

                    superdesk.getMenu(superdesk.MENU_MAIN)
                        .then(filterSettingsIfEmpty)
                        .then((menu) => {
                            scope.menu = menu;
                            setActiveMenuItem($route.current);
                        });

                    function filterSettingsIfEmpty(menu) {
                        return superdesk.getMenu(superdesk.MENU_SETTINGS).then((settingsMenu) => {
                            if (!settingsMenu.length) {
                                _.remove(menu, {_settings: 1});
                            }

                            return menu;
                        });
                    }

                    scope.toggleMenu = function() {
                        ctrl.flags.menu = !ctrl.flags.menu;
                    };

                    scope.toggleNotifications = function() {
                        ctrl.flags.notifications = !ctrl.flags.notifications;
                    };

                    scope.toggleBeta = function() {
                        betaService.toggleBeta();
                    };

                    function setActiveMenuItem(route) {
                        if (typeof route !== 'object' || typeof route.href !== 'string') {
                            return;
                        }

                        _.each(scope.menu, (activity) => {
                            activity.isActive = route && route.href &&
                                    route.href.substr(0, activity.href.length) === activity.href;
                        });

                        if (route && route.href) {
                            scope.activeMenuItemPath = getActiveMenuItemPath(route.href);
                        }
                    }

                    scope.$on('$locationChangeStart', () => {
                        ctrl.flags.menu = false;
                    });

                    scope.$watch(function currentRoute() {
                        return ctrl.currentRoute;
                    }, () => {
                        scope.currentRoute = ctrl.currentRoute;
                        setActiveMenuItem(ctrl.currentRoute);
                    });

                    scope.notifications = userNotifications;

                    privileges.loaded.then(() => {
                        scope.privileges = privileges.privileges;
                        setMenuItems();
                        setActiveMenuItem(ctrl.currentRoute);
                    });

                    scope.openAbout = function() {
                        scope.aboutActive = true;
                    };
                    scope.closeAbout = function() {
                        scope.aboutActive = false;
                    };
                },
            };
        }])
    .directive('sdAbout', ['asset', 'api', function(asset, api) {
        return {
            templateUrl: asset.templateUrl('core/menu/views/about.html'),
            link: function(scope) {
                api.query('backend_meta', {}).then(
                    (metadata) => {
                        scope.build_rev = appConfig.version || metadata.meta_rev;
                        scope.modules = metadata.modules;
                    });
                scope.version = appConfig.version;
                scope.year = (new Date()).getUTCFullYear();
                scope.releaseDate = appConfig.releaseDate;
            },
        };
    }]);
