import {reactToAngular1} from 'superdesk-ui-framework';
import {GlobalMenuHorizontal} from './GlobalMenuHorizontal';
import {appConfig} from 'appConfig';
import {addInternalEventListener} from 'core/internal-events';
import {IFullWidthPageCapabilityConfiguration} from 'superdesk-api';

SuperdeskFlagsService.$inject = [];
function SuperdeskFlagsService() {
    this.flags = {
        menu: false,
        notifications: false,
    };

    Object.keys(appConfig.ui).filter((key) => key !== 'authoring').forEach((key) => {
        this.flags[key] = appConfig.ui[key];
    });
}

function setupFullWidthPage($scope) {
    const fullWidthConfig: IFullWidthPageCapabilityConfiguration = {enabled: false};

    $scope.fullWidthConfig = fullWidthConfig;

    $scope.fullWidthEnabled = false;

    $scope.setupFullWidthCapability = (config: IFullWidthPageCapabilityConfiguration) => {
        if (config.enabled && config.allowed) {
            const originalToggleFn = config.onToggle;

            const nextConfig: IFullWidthPageCapabilityConfiguration = {
                ...config,
                onToggle: (val) => {
                    $scope.fullWidthEnabled = val;
                    originalToggleFn(val);
                },
            };

            $scope.$applyAsync(() => {
                $scope.fullWidthConfig = nextConfig;
            });
        } else {
            $scope.$applyAsync(() => {
                $scope.fullWidthConfig = config;

                if (config.enabled !== true) {
                    $scope.fullWidthEnabled = false;
                }
            });
        }
    };
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
            setupFullWidthPage($scope);

            $scope.session = session;

            this.flags = superdeskFlags.flags;

            /**
             * `$scope.popup` is true when an article is opened in full screen in new window
             * `hideMonitoring` is true when authoring view is switched to full screen in the same window
             */
            function shouldRenderMonitoring() {
                return $scope.popup !== true && superdeskFlags.flags.hideMonitoring !== true;
            }

            $scope.renderMonitoring = shouldRenderMonitoring();

            $scope.$watch(shouldRenderMonitoring, (renderMonitoring) => {
                if ($scope.renderMonitoring !== renderMonitoring) {
                    $scope.renderMonitoring = renderMonitoring;
                }
            });

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

            // full preview

            $scope.fullPreviewItems = [];

            $scope.closeFullPreview = () => {
                $scope.fullPreviewItems = [];
            };

            const removeMultiPreviewEventListener = addInternalEventListener('openFullPreview', (event) => {
                $scope.fullPreviewItems = event.detail;
                $scope.$apply();
            });

            $scope.itemsForExport = null;

            /**
             * Called from:
             * scripts/apps/archive/views/export.html
             * scripts/apps/archive/directives/Export.ts
             *
             * It's a dirty solution to define it in the root scope, it would be better to pass it as a parameter
             * to each directive instance, but that directive is already reading scopes of other controllers/directives
             * and if `scope: {closeExport: '=?'}` was defined - these other scopes might become inaccessible
             */
            $scope.closeExport = () => {
                $scope.itemsForExport = null;
            };

            const removeOpenExportListener = addInternalEventListener('openExportView', (event) => {
                $scope.itemsForExport = event.detail;
                $scope.$apply();
            });

            // remove listeners
            $scope.$on('$destroy', () => {
                removeMultiPreviewEventListener();
                removeOpenExportListener();
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
                    let body = angular.element('body');

                    scope.currentRoute = null;
                    scope.flags = ctrl.flags;
                    scope.menu = [];
                    scope.theme = localStorage.getItem('theme') || '';
                    scope.isTestEnvironment = appConfig.isTestEnvironment;
                    scope.environmentName = appConfig.environmentName;
                    scope.workspaceConfig = appConfig.workspace || {}; // it's used in workspaceMenu.filter

                    // set theme
                    body.attr('data-theme', scope.theme);

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
                        scope.modules = metadata.modules;
                    });
                scope.version = appConfig.version;
                scope.year = (new Date()).getUTCFullYear();
                scope.releaseDate = appConfig.releaseDate;
            },
        };
    }]);
