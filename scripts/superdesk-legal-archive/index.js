import { LegalArchiveService } from './services';
import { LegalArchiveController } from './controllers';
import { LegalItemSortbar } from './directives';

export default angular.module('superdesk.legal_archive', [
    'superdesk.activity',
    'superdesk.api'
])
    .service('legal', LegalArchiveService)
    .directive('sdLegalItemSortbar', LegalItemSortbar)

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('legal_archive', {
            type: 'http',
            backend: {rel: 'legal_archive'}
        });

        apiProvider.api('legal_archive_versions', {
            type: 'http',
            backend: {rel: 'legal_archive_versions'}
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
                templateUrl: 'scripts/superdesk-legal-archive/views/legal_archive.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                reloadOnSearch: false,
                filters: [],
                privileges: {legal_archive: 1}
            });
    }]);
