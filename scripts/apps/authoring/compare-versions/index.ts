import './compare-versions.scss';

import CompareVersionsService from './CompareVersionsService';
import CompareVersionsController from './CompareVersionsController';
import * as directive from './directives';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.authoring.compare_versions
 * @name superdesk.apps.authoring.compare_versions
 * @packageName superdesk.apps
 * @description Superdesk compare_versions module allows to view selected versions of an opened article.
 */
angular.module('superdesk.apps.authoring.compare_versions',
    ['superdesk.core.activity', 'superdesk.apps.authoring'])
    .service('compareVersions', CompareVersionsService)
    .directive('sdCompareVersionsInnerDropdown', directive.CompareVersionsDropdownInnerDirective)
    .directive('sdCompareVersionsArticle', directive.CompareVersionsArticleDirective)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('compare-versions', {
                category: '/authoring',
                href: '/compare-versions',
                when: '/compare-versions',
                label: gettext('Authoring'),
                templateUrl: 'scripts/apps/authoring/compare-versions/views/compare-versions.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                controller: CompareVersionsController,
                filters: [{action: 'author', type: 'compare-versions'}],
            });
    }]);
