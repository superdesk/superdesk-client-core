import _ from 'lodash';

class LinkFunction {
    constructor(compareVersions, scope, elem, attrs) {
        this.compareVersions = compareVersions;
        this.scope = scope;
        this.elem = elem;
        this.attrs = attrs;

        // contains selected versions
        this.compareVersionsItems = [];

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsInnerDropdown#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        // watches the selected versions of an item and filter out unselected versions
        // to provide in inner dropdown as a rest of available versions.
        this.scope.$watch(() => this.compareVersions.items, (items) => {
            this.compareVersionsItems = _.map(this.compareVersions.items, (board) => board.article);
            this.filter();
        }, true);

        this.scope.open = this.open.bind(this);
    }

    // provides unselected versions to fill in inner dropdown
    filter() {
        this.scope.items = _.reject(this.compareVersions.versions, (item) =>
            _.find(this.compareVersionsItems, {id: item._id, version: item._current_version}));
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsInnerDropdown#open
     * @param {Object} itemVersion - {id: _id, version: _current_version}
     * @description opens the provided version in compare-versions screen's board.
     */
    open(itemVersion) {
        this.compareVersions.edit(itemVersion, this.attrs.board);
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.compare_versions
 * @name sdCompareVersionsInnerDropdown
 * @requires compareVersions
 * @description Displays the list of un-selected versions available to open in
 * compare-versions screen and that appears on menu selection located at top of each opened board.
 */
export function CompareVersionsDropdownInnerDirective(compareVersions) {
    return {
        template: require('scripts/apps/authoring/compare-versions/views/sd-compare-versions-inner-dropdown.html'),
        link: (scope, elem, attrs) => new LinkFunction(compareVersions, scope, elem, attrs),
    };
}

CompareVersionsDropdownInnerDirective.$inject = ['compareVersions'];
