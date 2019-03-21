import SuggestController from './SuggestController';

class LinkFunction {
    suggest: any;
    scope: any;
    elem: any;

    constructor(suggest, scope, elem) {
        this.suggest = suggest;
        this.scope = scope;
        this.elem = elem;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdSuggest#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        this.scope.showItem = null;
        this.scope.$watch('ngShow', this.toggleActive.bind(this));
        this.scope.$watch(() => this.suggest.active, this.toggleVisible.bind(this));

        this.suggest.onUpdate(this.onUpdate.bind(this));
    }

    /**
     * @ngdoc method
     * @name sdSuggest#onUpdate
     * @param {Object} resp The list of items received after the update.
     * @private
     * @description onUpdate is the callback that will be triggered whenever the
     * suggest service updates with new items.
     */
    onUpdate(resp) {
        this.scope.items = resp._items;
        this.scope.$apply();
    }

    /**
     * @ngdoc method
     * @name sdSuggest#toggleActive
     * @param {Boolean} v The new value for the active state.
     * @private
     * @description Toggles the active state of the service.
     */
    toggleActive(v) {
        this.suggest.setActive(v);
    }

    /**
     * @ngdoc method
     * @name sdSuggest#toggleVisible
     * @param {Boolean} v The new value for the visible state.
     * @private
     * @description Toggles the visible state of the panel.
     */
    toggleVisible(v) {
        this.scope.ngShow = v;
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdSuggest
 * @requires suggest
 * @param {Boolean} ngShow ngShow determines the visibility of the directive.
 * @description sd-suggest operates the live suggestions panel that appears
 * to the left of the authoring component.
 */
export default function SuggestDirective(suggest) {
    return {
        scope: {ngShow: '='},
        template: require('./SuggestView.html'),
        controller: SuggestController,
        controllerAs: 'ctrl',
        link: (scope, elem) => new LinkFunction(suggest, scope, elem),
    };
}

SuggestDirective.$inject = ['suggest'];
