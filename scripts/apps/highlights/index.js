/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/highlights.less';

import { HighlightsService } from './services';
import * as ctrl from './controllers';
import * as directive from './directives';

export default angular.module('superdesk.apps.highlights', [
    'superdesk.apps.desks',
    'superdesk.apps.packaging',
    'superdesk.core.activity',
    'superdesk.core.api'
])
    .service('highlightsService', HighlightsService)

    .directive('sdCreateHighlightsButton', directive.CreateHighlightsButton)
    .directive('sdMarkHighlightsDropdown', directive.MarkHighlightsDropdown)
    .directive('sdMultiMarkHighlightsDropdown', directive.MultiMarkHighlightsDropdown)
    .directive('sdPackageHighlightsDropdown', directive.PackageHighlightsDropdown)
    .directive('sdHighlightsInfo', directive.HighlightsInfo)
    .directive('sdHighlightsTitle', directive.HighlightsTitle)
    .directive('sdSearchHighlights', directive.SearchHighlights)
    .directive('sdHighlightsConfig', () => ({controller: ctrl.HighlightsConfig}))
    .directive('sdHighlightsConfigModal', directive.HighlightsConfigModal)
    .directive('sdHighlightLabel', directive.HighlightsLabel)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('mark.item', {
                label: gettext('Mark for highlight'),
                priority: 30,
                icon: 'star',
                dropdown: directive.HighlightsReactDropdown,
                keyboardShortcut: 'ctrl+shift+d',
                templateUrl: 'scripts/apps/highlights/views/mark_highlights_dropdown.html',
                filters: [
                    {action: 'list', type: 'archive'}
                ],
                additionalCondition:['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).mark_item;
                }],
                group: 'packaging'
            })
            .activity('/settings/highlights', {
                label: gettext('Highlights'),
                controller: ctrl.HighlightsSettings,
                templateUrl: 'scripts/apps/highlights/views/settings.html',
                category: superdesk.MENU_SETTINGS,
                priority: -800,
                privileges: {highlights: 1}
            }).
            activity('/workspace/highlights', {
                label: gettext('Highlights View'),
                priority: 100,
                templateUrl: 'scripts/apps/monitoring/views/highlights-view.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('highlights', {
            type: 'http',
            backend: {rel: 'highlights'}
        });
        apiProvider.api('markForHighlights', {
            type: 'http',
            backend: {rel: 'marked_for_highlights'}
        });
        apiProvider.api('generate_highlights', {
            type: 'http',
            backend: {rel: 'generate_highlights'}
        });
    }]);
