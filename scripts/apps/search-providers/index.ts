/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import {providerTypes} from './constants';
import SearchProviderService from './service';
import SearchProviderConfigDirective from './directive';
import { coreMenuGroups } from 'core/activity/activity';

SearchProviderSettingsController.$inject = ['$scope', 'privileges'];
function SearchProviderSettingsController($scope, privileges) { /* no-op */ }

/**
 * @ngdoc module
 * @module superdesk.apps.searchProviders
 * @name superdesk.apps.searchProviders
 * @packageName superdesk.apps
 * @description Adds support for various search providers to Superesk.
 */
export default angular.module('superdesk.apps.searchProviders', [
    'superdesk.core.activity',
    'superdesk.core.api',
])
    .value('providerTypes', providerTypes)
    .directive('sdSearchProviderConfig', SearchProviderConfigDirective)
    .service('searchProviderService', SearchProviderService)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/searchProviders', {
                label: gettext('Search Providers'),
                templateUrl: 'scripts/apps/search-providers/views/settings.html',
                controller: SearchProviderSettingsController,
                category: superdesk.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
                privileges: {search_providers: 1},
                priority: 2000,
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('search_providers', {
            type: 'http',
            backend: {rel: 'search_providers'},
        });
    }]);
