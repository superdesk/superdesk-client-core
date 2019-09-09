import {reactToAngular1} from 'superdesk-ui-framework';
import {GlobalMenuHorizontal} from './GlobalMenuHorizontal';
import {trimStartExact} from 'core/helpers/utils';

SuperdeskFlagsService.$inject = ['config'];
function SuperdeskFlagsService(config) {
    this.flags = {
        menu: false,
        notifications: false,
    };

    angular.extend(this.flags, config.ui);
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
        SuperdeskViewController.$inject = ['superdeskFlags', 'superdesk', '$scope', '$route', 'session'];
        function SuperdeskViewController(superdeskFlags, superdesk, $scope, $route, session) {
            $scope.session = session;

            this.flags = superdeskFlags.flags;
            this.openUpload = function openUpload(files) {
                let uploadData = {
                    files: files,
                    deskSelectionAllowed: true,
                };

                superdesk.intent('upload', 'media', uploadData);
            };

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
        'config',
        'deployConfig',
        'lodash',
        'workspaceMenu',
        function(
            $route,
            superdesk,
            betaService,
            userNotifications,
            asset,
            privileges,
            config,
            deployConfig,
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
                    scope.isTestEnvironment = config.isTestEnvironment;
                    scope.environmentName = config.environmentName;

                    // menu items and groups - start
                    let group = null;

                    scope.items = [];

                    workspaceMenu
                        .filter((item) => !item.if || scope.$eval(item.if))
                        .forEach((item) => {
                            const itemGroup = item.group || group;

                            if (itemGroup !== group) {
                                scope.items.push({hr: 1});
                                group = itemGroup;
                            }

                            scope.items.push(item);
                        });
                    // menu items and groups - end

                    /*
                        Marking item as active even if current path doesn't match exactly to item href path
                        For example, if current path is /a/b/c and there is only menu item for /a/b,
                        /a/b should be set active.
                    */
                    function getActiveMenuItemPath(currentPath: string) {
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

                            matchingUrls.reduce((currentDeepest, current) => {
                                return currentDeepest.split('/').length < current.split('/').length
                                    ? current
                                    : currentDeepest;
                            });
                    }

                    deployConfig.get('feedback_url').then((url) => {
                        scope.feedback_url = url;
                    });

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
                        _.each(scope.menu, (activity) => {
                            activity.isActive = route && route.href &&
                                    route.href.substr(0, activity.href.length) === activity.href;
                        });

                        scope.activeMenuItemPath = getActiveMenuItemPath(route.href);
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
    .directive('sdAbout', ['asset', 'config', 'api', function(asset, config, api) {
        return {
            templateUrl: asset.templateUrl('core/menu/views/about.html'),
            link: function(scope) {
                api.query('backend_meta', {}).then(
                    (metadata) => {
                        scope.build_rev = config.version || metadata.meta_rev;
                        scope.modules = metadata.modules;
                    });
                scope.version = config.version;
                scope.year = (new Date()).getUTCFullYear();
                scope.releaseDate = config.releaseDate;
            },
        };
    }]);
