import {COMPACT_LIST_VIEW, GRID_VIEW} from 'apps/archive/utils';
import {gettext} from 'core/utils';

/**
 * @ngdoc controller
 * @module superdesk.apps.content-api
 * @name ContentAPIController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires pageTitle
 * @requires preferencesService
 *
 * @description ContentAPIController
 */
export class ContentAPIController {
    $scope: any;
    $location: any;
    preferencesService: any;
    preferencesUpdate: any;

    constructor($scope, $location, pageTitle, preferencesService) {
        this.$scope = $scope;
        this.$location = $location;
        this.preferencesService = preferencesService;
        pageTitle.setUrl(gettext('Content API Search'));

        this.$scope.flags = {
            hideActions: true,
        };

        this.$scope.selected = {
            preview: null,
        };

        this.$scope.setView = this.setView.bind(this);
        this.$scope.preview = this.preview.bind(this);
        this.preferencesUpdate = {
            'archive:view': {
                allowed: [GRID_VIEW, COMPACT_LIST_VIEW],
                category: 'archive',
                view: GRID_VIEW,
                default: GRID_VIEW,
                label: 'Users archive view format',
                type: 'string',
            },
        };

        preferencesService.get('archive:view').then((result) => {
            this.$scope.view = result.view ? result.view : GRID_VIEW;
        });
    }

    /**
     * @ngdoc method
     * @name ContentAPIController#setView
     * @description Sets the view to be List or Grid
     */
    setView(view) {
        this.$scope.view = view || GRID_VIEW;
        this.preferencesUpdate['archive:view'].view = this.$scope.view;
        this.preferencesService.update(this.preferencesUpdate, 'archive:view');
    }

    /**
     * @ngdoc method
     * @name ContentAPIController#preview
     * @description Preview the item
     */
    preview(item) {
        this.$scope.selected.preview = item;
        this.$location.search('_id', item ? item._id : null);
    }
}

ContentAPIController.$inject = ['$scope', '$location', 'pageTitle', 'preferencesService'];
