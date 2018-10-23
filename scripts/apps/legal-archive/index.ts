import {LegalArchiveService} from './services';
import {LegalArchiveController} from './controllers';
import {LegalItemSortbar} from './directives';

/**
 * @ngdoc module
 * @module superdesk.apps.legal_archive
 * @name superdesk.apps.legal_archive
 * @packageName superdesk.apps
 * @description Application that adds legal archive support.
 */
export default angular.module('superdesk.apps.legal_archive', [
    'superdesk.core.datetime',
    'superdesk.core.activity',
    'superdesk.core.api',
    'superdesk.apps.search',
])
    .service('legal', LegalArchiveService)
    .directive('sdLegalItemSortbar', LegalItemSortbar)

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('legal_archive', {
            type: 'http',
            backend: {rel: 'legal_archive'},
        });

        apiProvider.api('legal_archive_versions', {
            type: 'http',
            backend: {rel: 'legal_archive_versions'},
        });
    }])

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/legal_archive/', {
                label: gettext('Legal Archive'),
                description: gettext('Confidential data'),
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                controller: LegalArchiveController,
                templateUrl: 'scripts/apps/legal-archive/views/legal_archive.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                reloadOnSearch: false,
                filters: [],
                privileges: {legal_archive: 1},
                features: {legal_archive: 1},
            });
    }]);
