import { ManageContentFiltersController } from 'superdesk-content-filters/controllers';

/**
 * @memberof superdesk.content_filters
 * @ngdoc directive
 * @name sdManageFiltersTab
 * @description
 *   A directive that simply loads the view for managing content filters and
 *   connects it with its controller (ManageContentFiltersCtrl).
 */
export function ManageFiltersTab() {
    return {
        templateUrl: 'scripts/superdesk-content-filters/views/manage-filters.html',
        controller: ManageContentFiltersController
    };
}
