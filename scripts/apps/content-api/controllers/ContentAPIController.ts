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
                allowed: ['mgrid', 'compact'],
                category: 'archive',
                view: 'mgrid',
                default: 'mgrid',
                label: 'Users archive view format',
                type: 'string',
            },
        };

        preferencesService.get('archive:view').then((result) => {
            this.$scope.view = result.view ? result.view : 'mgrid';
        });
    }

    /**
     * @ngdoc method
     * @name ContentAPIController#setView
     * @description Sets the view to be List or Grid
     */
    setView(view) {
        this.$scope.view = view || 'mgrid';
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
