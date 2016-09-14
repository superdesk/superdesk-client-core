import './styles/dashboard.less';
import './styles/settings.less';

import './ingest-stats-widget/stats';

import * as constant from './constants';
import * as ctrl from './controllers';
import * as svc from './services';
import * as directive from './directives';
import { InsertFilter, ScheduleFilter } from './filters';

angular.module('superdesk.ingest.send', ['superdesk.api', 'superdesk.desks'])
    .service('send', svc.SendService);

angular.module('superdesk.ingest', [
    'superdesk.search',
    'superdesk.dashboard',
    'superdesk.widgets.base',
    'superdesk.widgets.ingeststats',
    'superdesk.ingest.send',
    'superdesk.config'
])
    .value('feedingServices', constant.feedingServices)
    .value('feedParsers', constant.feedParsers)

    .service('ingestSources', svc.IngestProviderService)
    .service('remove', svc.RemoveIngestedService)
    .factory('subjectService', svc.SubjectService)

    .directive('sdIngestSourcesContent', directive.IngestSourcesContent)
    .directive('sdIngestRulesContent', directive.IngestRulesContent)
    .directive('sdIngestRoutingContent', directive.IngestRoutingContent)
    .directive('sdIngestRoutingGeneral', directive.IngestRoutingGeneral)
    .directive('sdIngestRoutingFilter', directive.IngestRoutingFilter)
    .directive('sdIngestRoutingAction', directive.IngestRoutingAction)
    .directive('sdIngestRoutingSchedule', directive.IngestRoutingSchedule)
    .directive('sdPieChartDashboard', directive.PieChartDashboard)
    .directive('sdSortrules', directive.SortRules)
    .directive('sdUserIngestDashboardDropDown', directive.IngestUserDashboardDropdown)
    .directive('sdUserIngestDashboardList', directive.IngestUserDashboardList)
    .directive('sdUserIngestDashboard', directive.IngestUserDashboard)

    .filter('insert', InsertFilter)
    .filter('scheduleFilter', ScheduleFilter)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/workspace/ingest', {
                label: gettext('Workspace'),
                priority: 100,
                controller: ctrl.IngestListController,
                templateUrl: 'scripts/superdesk-archive/views/list.html',
                category: '/workspace',
                topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html',
                privileges: {ingest: 1}
            })

            .activity('/settings/ingest', {
                label: gettext('Ingest'),
                templateUrl: 'scripts/superdesk-ingest/views/settings/settings.html',
                controller: ctrl.IngestSettingsController,
                category: superdesk.MENU_SETTINGS,
                privileges: {ingest_providers: 1}
            })

            .activity('/ingest_dashboard', {
                label: gettext('Ingest Dashboard'),
                templateUrl: 'scripts/superdesk-ingest/views/dashboard/dashboard.html',
                controller: ctrl.IngestDashboardController,
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                privileges: {ingest_providers: 1}
            })

            .activity('remove_ingested', {
                label: gettext('Remove'),
                icon: 'trash',
                controller: ['data', 'remove', function(data, remove) {
                    remove.remove(data.item);
                }],
                filters: [{action: 'list', type: 'ingest'}],
                additionalCondition:['remove', 'item', function(remove, item) {
                    return remove.canRemove(item);
                }],
                privileges: {fetch: 1}
            })

            .activity('fetchAs', {
                label: gettext('Fetch To'),
                icon: 'fetch-as',
                controller: ['data', 'send', function(data, send) {
                    send.allAs([data.item]);
                }],
                filters: [{action: 'list', type: 'ingest'}],
                privileges: {fetch: 1}
            })

            .activity('archive', {
                label: gettext('Fetch'),
                icon: 'archive',
                monitor: true,
                controller: ['send', 'data', function(send, data) {
                    return send.one(data.item);
                }],
                filters: [{action: 'list', type: 'ingest'}],
                privileges: {fetch: 1},
                key: 'f',
                additionalCondition: ['desks', function (desks) {
                    // fetching to 'personal' desk is not allowed
                    return desks.getCurrentDeskId() != null;
                }]
            })

            .activity('externalsource', {
                label: gettext('Get from external source'),
                icon: 'archive',
                monitor: true,
                controller: ctrl.ExternalSourceController,
                filters: [{action: 'list', type: 'externalsource'}],
                privileges: {fetch: 1}
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('fetch', {
            type: 'http',
            backend: {rel: 'fetch'}
        });
        apiProvider.api('ingest', {
            type: 'http',
            backend: {rel: 'ingest'}
        });
        apiProvider.api('ingestProviders', {
            type: 'http',
            backend: {rel: 'ingest_providers'}
        });
        apiProvider.api('activity', {
            type: 'http',
            backend: {rel: 'activity'}
        });
    }])

    .run(['remove', remove => { remove.fetchProviders(); }]);
