/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

(function() {
    'use strict';

    var app = angular.module('superdesk.profiling', []);

    ProfilingController.$inject = ['$scope', 'api'];
    function ProfilingController($scope, api) {
        $scope.profiling_data = [];
        $scope.current_profile = null;
        $scope.profiles = ['rest', 'publish:enqueue', 'publish:transmit'];
        $scope.profile_names = {'rest': 'Rest', 'publish:enqueue': 'Publish Enqueue', 'publish:transmit': 'Publish Transmit'};

        /*
        * Populates the profiling data.
        */
        function populateProfilingData () {
            api.profiling.getById($scope.current_profile).then(function(profile) {
                $scope.profiling_data = profile.profiling_data;
                $scope.lastRefreshedAt = new Date();
            });
        }

        $scope.reload = function() {
            populateProfilingData();
        };

        $scope.reset = function() {
            api.profiling.remove({_links: {self: {href: 'profiling'}}});
            $scope.reload();
        };

        $scope.loadProfile = function(profile) {
            if (profile !== $scope.current_profile) {
                $scope.current_profile = profile;
                $scope.profiling_data = [];
                $scope.reload();
            }
        };

        $scope.reload();
    }

    app.controller('profilingCtrl', ProfilingController);

    app
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/profiling', {
                    label: gettext('Profiling Data'),
                    templateUrl: 'scripts/superdesk-profiling/views/profiling.html',
                    sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                    controller: ProfilingController,
                    category: superdesk.MENU_MAIN,
                    adminTools: false,
                    privileges: {profiling: 1}
                });
        }])
        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('profiling', {
                type: 'http',
                backend: {
                    rel: 'profiling'
                }
            });
        }]);

    return app;
})();
