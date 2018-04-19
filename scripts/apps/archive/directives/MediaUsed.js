class LinkFunction {
    constructor(superdesk, api, familyService, scope) {
        this.scope = scope;
        this.superdesk = superdesk;
        this.api = api;
        this.familyService = familyService;

        this.init();
        this.scope.open = this.open.bind(this);

        this.fetchUsedItems();
    }

    /**
     * @ngdoc method
     * @name sdMediaUsed#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        this.scope.$watch('item', (newVal, oldVal) => {
            if (newVal !== oldVal) {
                this.fetchUsedItems();
            }
        });
    }

    /**
     * @ngdoc method
     * @name sdMediaUsed#fetchUsedItems
     * @private
     * @description Fetches stories using this media and assigns to scope
     */
    fetchUsedItems() {
        return this.familyService.fetchMediaUsedItems(this.scope.item.unique_id).then((items) => {
            this.scope.usedItems = items;
        });
    }

    /**
     * @ngdoc method
     * @name sdMediaUsed#open
     * @private
     * @description Trigger opening of an item for edit
     */
    open(item) {
        this.superdesk.intent('view', 'item', item).then(null, () => {
            this.superdesk.intent('edit', 'item', item);
        });
    }
}

/**
 * @module superdesk.apps.archive
 * @ngdoc directive
 * @name sdMediaUsed
 * @requires superdesk
 * @requires api
 * @requires familyService
 * @description This directive is used to fetch and display stories in which a media item is used
 */
export function MediaUsed(superdesk, api, familyService) {
    return {
        scope: {
            item: '=item',
        },
        template: require('scripts/apps/archive/views/media-used-view.html'),
        link: (scope, elem) => new LinkFunction(superdesk, api, familyService, scope),
    };
}

MediaUsed.$inject = ['superdesk', 'api', 'familyService'];
