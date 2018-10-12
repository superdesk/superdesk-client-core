import {ManageContentFiltersController} from 'apps/content-filters/controllers';

/**
 * @ngdoc directive
 * @module superdesk.apps.content_filters
 * @name sdManageFiltersTab
 * @description
 *   A directive that simply loads the view for managing content filters and
 *   connects it with its controller (ManageContentFiltersCtrl).
 */
export function ManageFiltersTab() {
    return {
        templateUrl: 'scripts/apps/content-filters/views/manage-filters.html',
        controller: ManageContentFiltersController,
    };
}
