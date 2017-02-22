
InternalDestinationsFactory.$inject = ['api'];
function InternalDestinationsFactory(api) {
    class InternalDestinationsService {
        query(params) {
            let queryParams = params || {};

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

InternalDestinationsController.$inject = ['internalDestinations'];
function InternalDestinationsController(internalDestinations) {
    this.create = () => {
        this.active = {is_active: false};
    };

    this.edit = (dest) => {
        this.active = angular.extend({}, dest);
    };

    this.remove = (dest) => {
        internalDestinations.remove(dest).then(this.load);
    };

    this.stopEdit = () => {
        this.active = null;
    };

    this.save = (dest) => {
        internalDestinations.save(dest).then(this.load);
        this.stopEdit();
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
                privileges: {publish: 1}
            });
    }]);
