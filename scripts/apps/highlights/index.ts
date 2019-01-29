/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/highlights.scss';

import {HighlightsService} from './services';
import * as ctrl from './controllers';
import * as directive from './directives';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.highlights
 * @name superdesk.apps.highlights
 * @packageName superdesk.apps
 * @description Superdesk module that adds highlights functionality to archive
 * items.
 */
export default angular.module('superdesk.apps.highlights', [
    'superdesk.apps.desks',
    'superdesk.apps.packaging',
    'superdesk.core.activity',
    'superdesk.core.api',
    'superdesk.apps.workspace.menu',
])
    .service('highlightsService', HighlightsService)

    .directive('sdCreateHighlightsButton', directive.CreateHighlightsButton)
    .directive('sdMarkHighlightsDropdown', directive.MarkHighlightsDropdown)
    .directive('sdMultiMarkHighlightsDropdown', directive.MultiMarkHighlightsDropdown)
    .directive('sdPackageHighlightsDropdown', directive.PackageHighlightsDropdown)
    .directive('sdHighlightsInfo', directive.HighlightsInfo)
    .directive('sdSearchHighlights', directive.SearchHighlights)
    .directive('sdHighlightsConfig', () => ({controller: ctrl.HighlightsConfig}))
    .directive('sdHighlightsConfigModal', directive.HighlightsConfigModal)
    .directive('sdHighlightLabel', directive.HighlightsLabel)

    .config(['superdeskProvider', 'workspaceMenuProvider', (superdesk, workspaceMenuProvider) => {
        superdesk
            .activity('mark.item', {
                label: gettext('Mark for highlight'),
                priority: 30,
                icon: 'star',
                dropdown: directive.HighlightsReactDropdown,
                keyboardShortcut: 'ctrl+shift+^',
                templateUrl: 'scripts/apps/highlights/views/mark_highlights_dropdown.html',
                filters: [
                    {action: 'list', type: 'archive'},
                ],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).mark_item_for_highlight;
                }],
                group: 'highlights',
            })
            .activity('/settings/highlights', {
                label: gettext('Highlights'),
                controller: ctrl.HighlightsSettings,
                templateUrl: 'scripts/apps/highlights/views/settings.html',
                category: superdesk.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_CONFIG,
                priority: -800,
                privileges: {highlights: 1},
            })
            .activity('/workspace/highlights', {
                label: gettext('Highlights View'),
                priority: 100,
                templateUrl: 'scripts/apps/monitoring/views/highlights-view.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            });

        workspaceMenuProvider.item({
            href: '/workspace/highlights',
            label: gettext('Highlights'),
            templateUrl: 'scripts/apps/highlights/views/menu.html',
            order: 400,
            shortcut: 'ctrl+alt+h',
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('highlights', {
            type: 'http',
            backend: {rel: 'highlights'},
        });
        apiProvider.api('markForHighlights', {
            type: 'http',
            backend: {rel: 'marked_for_highlights'},
        });
        apiProvider.api('generate_highlights', {
            type: 'http',
            backend: {rel: 'generate_highlights'},
        });
    }]);
