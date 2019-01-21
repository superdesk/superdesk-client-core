import {FILTER_FIELDS} from '../constants';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc controller
 * @module superdesk.apps.contacts
 * @name ContactsController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires pageTitle
 * @requires preferencesService
 * @requires contacts service
 * @requires _ lodash
 *
 * @description ContactsController
 */
export class ContactsController {
    constructor($scope, $location, pageTitle, preferencesService, metadata, privileges, contacts, _) {
        this.$scope = $scope;
        this.$location = $location;
        this.contacts = contacts;

        this.preferencesService = preferencesService;
        this.$scope.privileges = privileges.privileges;
        pageTitle.setUrl(gettext('Superdesk Contacts Management'));

        this.$scope.openAdvanceSearch = false;

        this.$scope.selected = {
            preview: null,
        };

        this.$scope.setView = this.setView.bind(this);
        this.$scope.preview = this.preview.bind(this);
        this.preferencesUpdate = {
            'contacts:view': {
                allowed: ['photogrid', 'compact'],
                category: 'contacts',
                view: 'photogrid',
                default: 'photogrid',
                label: 'Users contacts view format',
                type: 'string',
            },
        };

        preferencesService.get('contacts:view').then((result) => {
            this.$scope.view = result.view ? result.view : 'photogrid';

            // Contacts previously allowed mgrid view
            // Make sure the user preferences does not have this value
            if (['photogrid', 'compact'].indexOf(this.$scope.view) < 0) {
                this.$scope.view = 'photogrid';
                this.updateViewPreferences();
            }
        });

        metadata.initialize().then(() => {
            this.$scope.metadata = metadata.values;
        });

        this.$scope.createContact = this.createContact.bind(this);
        this.$scope.filterContacts = this.filterContacts.bind(this);
        this.$scope.filters = {
            privacyOptions: this.contacts.privacyOptions,
            statusOptions: this.contacts.statusOptions,
            selectedStatus: _.find(this.contacts.statusOptions,
                (s) => s.value === (_.get(this.$location.search(), FILTER_FIELDS.STATUS) || null)),
            selectedPrivacy: _.find(this.contacts.privacyOptions,
                (p) => p.value === (_.get(this.$location.search(), FILTER_FIELDS.PRIVACY_LEVEL) || null)),
        };

        // set default status filter as active
        if (!_.get(this.$location.search(), FILTER_FIELDS.STATUS)) {
            this.filterContacts(FILTER_FIELDS.STATUS, _.find(this.contacts.statusOptions, (s) => s.value === 'true'));
        }
    }

    /**
     * @ngdoc method
     * @name ContactsController#setView
     * @description Sets the view to be List or Grid
     */
    setView(view) {
        this.$scope.view = view || 'photogrid';
        this.updateViewPreferences();
    }

    updateViewPreferences() {
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

    filterContacts(field, option) {
        if (field === FILTER_FIELDS.PRIVACY_LEVEL) {
            this.$scope.filters.selectedPrivacy = option;
        }

        if (field === FILTER_FIELDS.STATUS) {
            this.$scope.filters.selectedStatus = option;
        }

        this.$location.search(field, _.get(option, 'value', null));
    }
}
ContactsController.$inject = ['$scope', '$location', 'pageTitle',
    'preferencesService', 'metadata', 'privileges', 'contacts', 'lodash'];
