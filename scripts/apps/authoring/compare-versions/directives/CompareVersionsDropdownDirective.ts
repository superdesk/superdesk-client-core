import _ from 'lodash';

class LinkFunction {
    compareVersions: any;
    desks: any;
    archiveService: any;
    scope: any;
    elem: any;

    constructor(compareVersions, desks, archiveService, scope, elem) {
        this.compareVersions = compareVersions;
        this.desks = desks;
        this.archiveService = archiveService;
        this.scope = scope;
        this.elem = elem;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsDropdown#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        this.scope.$watchGroup(['item._id', 'item._latest_version'], () => {
            this.fetchVersions();
        });

        this.scope.toggle = this.toggle.bind(this);
        this.scope.isSelected = this.isSelected.bind(this);
        this.scope.open = this.open.bind(this);
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsDropdown#fetchVersions
     * @private
     * @description fetches all the versions of currently opened article.
     */
    fetchVersions() {
        this.desks.initialize()
            .then(() => {
                this.scope.desks = this.desks.desks;
                this.scope.stages = this.desks.deskStages;

                return this.archiveService.getVersions(this.scope.item, this.desks, 'versions');
            })
            .then((versions) => {
                this.scope.items = this.compareVersions.versions = versions;

                this.scope.current = {
                    id: this.scope.item._id,
                    version: this.scope.item._current_version,
                };
                // maintains the list of selected versions for creating boards, by default the currently opened article.
                this.scope.queue = [this.scope.current];
            });
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsDropdown#toggle
     * @description toggles versions selection, except the current version of opened article
     * which remains always selected by default.
     */
    toggle(itemVersion) {
        if (itemVersion.version === this.scope.current.version) {
            return false;
        }
        if (this.scope.isSelected(itemVersion)) {
            this.scope.queue = _.reject(this.scope.queue, itemVersion);
        } else {
            this.scope.queue.push(itemVersion);
        }
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsDropdown#isSelected
     * @param {Object} itemVersion - {id: _id, version: _current_version}
     * @returns {Boolean}
     * @description checks if version is found selected.
     */
    isSelected(itemVersion) {
        return _.some(this.scope.queue, itemVersion);
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsDropdown#open
     * @description triggers boards creation to open all the selected versions of opened article.
     */
    open() {
        this.compareVersions.create(this.scope.queue);
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.compare_versions
 * @name sdCompareVersionsDropdown
 * @requires compareVersions
 * @requires desks
 * @requires archiveService
 * @description Operates the versions list of currently opened article and that appears
 * on selection of Compare versions menu item.
 */
export function CompareVersionsDropdownDirective(compareVersions, desks, archiveService) {
    return {
        template: require('scripts/apps/authoring/compare-versions/views/sd-compare-versions-dropdown.html'),
        link: (scope, elem) =>
            new LinkFunction(compareVersions, desks, archiveService, scope, elem),
    };
}

CompareVersionsDropdownDirective.$inject = ['compareVersions', 'desks', 'archiveService'];
