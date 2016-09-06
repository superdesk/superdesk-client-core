/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import { ProfilingController } from './controllers';

export default angular.module('superdesk.profiling', [])
    .controller('profilingCtrl', ProfilingController)

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
        apiProvider.api('profiling', {type: 'http', backend: {rel: 'profiling'}});
    }]);
