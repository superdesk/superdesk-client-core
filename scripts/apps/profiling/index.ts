/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import {ProfilingController} from './controllers';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.profiling
 * @name superdesk.apps.profiling
 * @packageName superdesk.apps
 * @description Enhances the application with profiling support for the workspace.
 */
export default angular.module('superdesk.apps.profiling', [])
    .controller('profilingCtrl', ProfilingController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/profiling', {
                label: gettext('Profiling Data'),
                templateUrl: 'scripts/apps/profiling/views/profiling.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                controller: ProfilingController,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                privileges: {profiling: 1},
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('profiling', {type: 'http', backend: {rel: 'profiling'}});
    }]);
