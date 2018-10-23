import {coreMenuGroups} from 'core/activity/activity';

InternalDestinationsFactory.$inject = ['api'];
function InternalDestinationsFactory(api) {
    class InternalDestinationsService {
        query(params) {
            const queryParams = params || {};

            queryParams.max_results = 200;
            return api.query('internal_destinations', params)
                .then((response) => response._items);
        }

        save(item) {
            return api.save('internal_destinations', item);
        }

        remove(item) {
            return api.remove(item);
        }
    }

    return new InternalDestinationsService();
}

InternalDestinationsController.$inject = ['internalDestinations', 'modal'];
function InternalDestinationsController(internalDestinations, modal) {
    this.error = null;

    this.create = () => {
        this.active = {is_active: false};
        this.error = null;
    };

    this.edit = (dest) => {
        this.active = angular.extend({}, dest);
        this.error = null;
    };

    this.remove = (dest) => {
        modal.confirm(gettext('Please confirm you want to delete internal destination.'))
            .then(() => {
                internalDestinations.remove(dest).then(this.load);
            });
    };

    this.stopEdit = () => {
        this.active = null;
        this.error = null;
    };

    this.save = (dest) => {
        internalDestinations.save(dest)
            .then(this.load)
            .then(this.stopEdit)
            .catch((reason) => {
                if (reason.status === 400) {
                    this.error = reason.data._issues;
                } else {
                    console.error(reason);
                }
            });
    };

    this.load = () => {
        internalDestinations.query().then((destinations) => {
            this.destinations = destinations;
        });
    };

    // init
    this.load();
}

angular.module('superdesk.apps.internal-destinations', [])
    .factory('internalDestinations', InternalDestinationsFactory)
    .config(['superdeskProvider', (superdeskProvider) => {
        superdeskProvider
            .activity('/settings/internal-destinations', {
                label: gettext('Internal Destinations'),
                template: require('./views/settings.html'),
                controller: InternalDestinationsController,
                controllerAs: 'dest',
                category: superdeskProvider.MENU_SETTINGS,
                settings_menu_group: coreMenuGroups.CONTENT_FLOW,
                privileges: {publish: 1},
            });
    }]);
