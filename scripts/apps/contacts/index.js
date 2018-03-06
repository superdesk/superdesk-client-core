import {ContactsController} from './controllers';
import * as directives from './directives';
import * as services from './services';
import './styles/contacts.scss';

/**
 * @ngdoc module
 * @module superdesk.apps.contacts
 * @name superdesk.apps.contacts
 * @packageName superdesk.apps
 * @description Superdesk Contacts Management.
 */
angular.module('superdesk.apps.contacts', [
    'superdesk.core.api',
    'superdesk.apps.publish',
    'superdesk.apps.search'
])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/contacts', {
                label: gettext('Media Contacts'),
                description: gettext('View/Manage media contacts'),
                priority: 100,
                category: superdesk.MENU_MAIN,
                adminTools: true,
                controller: ContactsController,
                templateUrl: 'scripts/apps/contacts/views/list.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                filters: [],
                reloadOnSearch: false,
                features: {contacts: 1},
                privileges: {view_contacts: 1}
            });
    }])
    .service('contacts', services.ContactsService)
    .directive('sdContactsSearchPanel', directives.ContactsSearchPanelDirective)
    .directive('sdContactsSearchResults', directives.ContactsSearchResultsDirective)
    .directive('sdContactsSortBar', directives.ContactsSortBarDirective)
    .directive('sdContactsList', directives.ContactList)
    .directive('sdContactEditor', directives.ContactEditorDirective)

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('contacts', {
            type: 'http',
            backend: {
                rel: 'contacts'
            }
        });
    }]);
