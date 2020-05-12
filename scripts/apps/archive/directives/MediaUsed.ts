class LinkFunction {
    scope: any;
    superdesk: any;

    constructor(superdesk, scope) {
        this.scope = scope;
        this.superdesk = superdesk;
        this.scope.open = this.open.bind(this);
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
export function MediaUsed(superdesk) {
    return {
        scope: {
            item: '=item',
            links: '=',
        },
        template: require('scripts/apps/archive/views/media-used-view.html'),
        link: (scope) => new LinkFunction(superdesk, scope),
    };
}

MediaUsed.$inject = ['superdesk'];
