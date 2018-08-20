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

    // set flags for other directives
    .directive('sdSuperdeskView', ['asset', function(asset) {
        SuperdeskViewController.$inject = ['superdeskFlags', 'superdesk'];
        function SuperdeskViewController(superdeskFlags, superdesk) {
            this.flags = superdeskFlags.flags;

            this.openUpload = function openUpload(files) {
                superdesk.intent('upload', 'media', files);
            };
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
        function($route, superdesk, betaService, userNotifications, asset, privileges, config, deployConfig, _) {
            return {
                require: '^sdSuperdeskView',
                templateUrl: asset.templateUrl('core/menu/views/menu.html'),
                link: function(scope, elem, attrs, ctrl) {
                    scope.currentRoute = null;
                    scope.flags = ctrl.flags;
                    scope.menu = [];
                    scope.isTestEnvironment = config.isTestEnvironment;
                    scope.environmentName = config.environmentName;

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
                    }

                    scope.$on('$locationChangeStart', () => {
                        ctrl.flags.menu = false;
                    });

                    scope.$watch(function currentRoute() {
                        return $route.current;
                    }, (route) => {
                        if (!route) {
                            return;
                        }

                        scope.currentRoute = route;
                        setActiveMenuItem(scope.currentRoute);
                        ctrl.flags.workspace = !!route.sideTemplateUrl;
                        ctrl.flags.workqueue = ctrl.flags.workqueue || true;
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
                        scope.build_rev = metadata.meta_rev;
                        scope.build_rev_core = metadata.meta_rev_core;
                        scope.build_rev_client = metadata.meta_rev_client;
                    });
                scope.version = config.version;
                scope.year = (new Date()).getUTCFullYear();
                scope.releaseDate = config.releaseDate;
            },
        };
    }]);
