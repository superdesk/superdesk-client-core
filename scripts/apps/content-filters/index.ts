/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014, 2015 Sourcefabric z.ú. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/content-filters.scss';

import {ContentFiltersService} from './services';
import {ManageFiltersTab} from './directives';
import * as ctrl from './controllers';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';

// XXX: For some reason, loading the superdesk.apps.content_filters module in
// tests fails to load due to "Unknown provider: superdeskProvider" error.
// This happens if any taste case uses the inject() function.
// Seems like something needs to be fixed in config, but for now loading
// superdesk.apps.publish module does the trick (FWIW, it's the module that
// contained the original code for the content_filters module).

/**
 * @ngdoc module
 * @module superdesk.apps.content_filters
 * @name superdesk.apps.content_filters
 * @packageName superdesk.apps
 * @description Superdesk package containing content filters.
 */
angular.module('superdesk.apps.content_filters', ['superdesk.apps.publish'])
    .config(['superdeskProvider', function(superdesk) {
        var templateUrl = 'scripts/apps/content-filters/' +
                          'views/settings.html';

        superdesk.activity('/settings/content-filters', {
            label: gettext('Content Filters'),
            controller: ctrl.ContentFiltersConfigController,
            controllerAs: 'ctrl',
            templateUrl: templateUrl,
            category: superdesk.MENU_SETTINGS,
            settings_menu_group: coreMenuGroups.CONTENT_FLOW,
            priority: -800,
            privileges: {dictionaries: 1},
        });
    }])
    .service('contentFilters', ContentFiltersService)
    .controller('ContentFiltersConfigCtrl', ctrl.ContentFiltersConfigController)
    .controller('FilterConditionsCtrl', ctrl.FilterConditionsController)
    .controller('ManageContentFiltersCtrl', ctrl.ManageContentFiltersController)
    .controller('ProductionTestCtrl', ctrl.ProductionTestController)
    .controller('FilterSearchCtrl', ctrl.FilterSearchController)
    .directive('sdManageFiltersTab', ManageFiltersTab)
;
