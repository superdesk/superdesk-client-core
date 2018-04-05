/**
 * @ngdoc controller
 * @module superdesk.apps.contacts
 * @name ContactsController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires pageTitle
 * @requires gettext
 * @requires preferencesService
 *
 * @description ContactsController
 */
export class ContactsController {
    constructor($scope, $location, pageTitle, gettext, preferencesService, metadata, privileges) {
        this.$scope = $scope;
        this.$location = $location;

        this.preferencesService = preferencesService;
        this.$scope.privileges = privileges.privileges;
        pageTitle.setUrl(gettext('Superdesk Contacts Management'));

        this.$scope.openAdvanceSearch = false;

        this.$scope.selected = {
            preview: null
        };

        this.$scope.setView = this.setView.bind(this);
        this.$scope.preview = this.preview.bind(this);
        this.preferencesUpdate = {
            'contacts:view': {
                allowed: ['mgrid', 'compact'],
                category: 'contacts',
                view: 'mgrid',
                default: 'mgrid',
                label: 'Users contacts view format',
                type: 'string'
            }
        };

        preferencesService.get('contacts:view').then((result) => {
            this.$scope.view = result.view ? result.view : 'mgrid';
        });

        metadata.initialize().then(() => {
            this.$scope.metadata = metadata.values;
        });

        this.$scope.createContact = this.createContact.bind(this);
    }

    /**
     * @ngdoc method
     * @name ContactsController#setView
     * @description Sets the view to be List or Grid
     */
    setView(view) {
        this.$scope.view = view || 'mgrid';
        this.preferencesUpdate['contacts:view'].view = this.$scope.view;
        this.preferencesService.update(this.preferencesUpdate, 'contacts:view');
    }

    /**
     * @ngdoc method
     * @name ContactsController#preview
     * @description Preview the item
     */
    preview(item) {
        this.$scope.selected.preview = item;
        this.$location.search('_id', item ? item._id : null);
    }

    createContact(type) {
        this.$scope.preview({});
    }
}
ContactsController.$inject = ['$scope', '$location', 'pageTitle', 'gettext',
    'preferencesService', 'metadata', 'privileges'];
