import _ from 'lodash';

class LinkFunction {
    scope: any;
    desks: any;
    authoring: any;
    highlightsService: any;
    filter: any;
    location: any;
    timeout: any;
    elem: any;

    constructor(desks, authoring, highlightsService, $filter, $location, $timeout, scope, elem) {
        this.desks = desks;
        this.authoring = authoring;
        this.highlightsService = highlightsService;
        this.filter = $filter;
        this.location = $location;
        this.timeout = $timeout;
        this.scope = scope;
        this.elem = elem;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        // Initialize required data
        if (this.scope.markField === 'marked_desks') {
            this.scope.deskMarking = true;
            this.scope.service = this.desks;
            this.scope.fetchFunction = 'fetchDesks';
            this.scope.idField = 'desk_id';
            this.scope.hasMarkItemPrivilege = this.authoring.itemActions(this.scope.item).mark_item_for_desks;
        } else {
            this.scope.deskMarking = false;
            this.scope.service = this.highlightsService;
            this.scope.fetchFunction = 'get';
            this.scope.idField = '_id';
            this.scope.hasMarkItemPrivilege = this.authoring.itemActions(this.scope.item).mark_item_for_highlight;
        }

        // Watch marks updates - listen to the event from server
        this.scope.$on('item:' + this.scope.markField, ($event, data) => {
            if (this.scope.item._id !== data.item_id) {
                return;
            }

            let marks = this.scope.marks || [];

            this.scope.$apply(() => {
                if (data.marked) {
                    this.scope.marks = marks.concat(data.mark_id);
                } else {
                    this.scope.marks = _.without(marks, data.mark_id);
                }
                this.updateMarkedItems();
            });
        });

        // Watch if the item being previewing/authored has changed
        this.scope.$watch('item', (item) => {
            if (item) {
                this.scope.marks = [];
                if (item[this.scope.markField] && item[this.scope.markField].length) {
                    // (if) marked_desks is an array of objects (else) highlights is an array if string: highlight ids
                    if (this.scope.deskMarking) {
                        this.scope.marks = _.map(item[this.scope.markField], this.scope.idField);
                    } else {
                        this.scope.marks = item[this.scope.markField];
                    }
                }
                this.updateMarkedItems();
            }
        });

        // Putting these two methods on scope as they are accessed by the template url's ng-click
        this.scope.toggleClass = this.toggleClass.bind(this);
        this.scope.unmark = this.unmark.bind(this);
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#unmark
     * @private
     * @param {string} mark - _id of the mark to be removed
     * @description Remove mark of an item and close the marks popup dropdown
     */
    unmark(mark) {
        this.scope.service.markItem(mark, this.scope.item).then(() => {
            this.timeout(() => {
                let popup = $(this.elem).find('.highlights-list');

                popup.filter('.open').children('.dropdown-toggle.dropdown__toggle')
                    .click();
            });
        });
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#toggleClass
     * @param {Boolean} isOpen - toggle value to be applied
     * @description Toggles 'open' class on dropdown menu element
     * @returns {Boolean}
     */
    toggleClass(isOpen, $event) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        this.scope.open = isOpen;
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#isActiveHighlights
     * @description Evaluates if any of item's highlights are active
     * @returns {Boolean}
     */
    isActiveHighlights() {
        var highlightStatuses = {};

        _.forEach(this.scope.markObjects, (highlight) => {
            var hours = this.filter('hoursFromNow')(this.scope.item.versioncreated);

            highlightStatuses[highlight._id] = this.highlightsService.isInDateRange(highlight, hours);
        });

        if (this.location.path() === '/workspace/highlights') {
            return highlightStatuses[this.location.search().highlight];
        }

        return this.scope.markObjects.some((h) => highlightStatuses[h._id]);
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#updateMarkedItems
     * @description Updates the item's mark property
     */
    updateMarkedItems() {
        this.scope.service[this.scope.fetchFunction]().then((result) => {
            this.scope.markObjects = result._items.filter((obj) => (this.scope.marks || []).includes(obj._id));

            // (if) marked_desks is an array of objects (else) highlights is an array if string: highlight ids
            if (this.scope.deskMarking) {
                let updatedDdeskMarks = [];

                _.forEach(this.scope.marks, (m) => {
                    updatedDdeskMarks.push({desk_id: m});
                });
                this.scope.item[this.scope.markField] = updatedDdeskMarks;
            } else {
                this.scope.item[this.scope.markField] = this.scope.marks;
            }

            // Do UI required changes
            if (this.scope.marks) {
                this.doIconUpdates();
            }
        });
    }

    /**
     * @ngdoc method
     * @name sdMarkedItemTitle#doIconUpdates
     * @description Adds required UI classes to the mark icons
     */
    doIconUpdates() {
        // To do - Change this method when a multi bell icon is added for desk markings

        // If highlights, add appropriate multi icon and color
        if (this.scope.deskMarking) {
            this.scope.className = 'icon-bell';
        } else {
            this.scope.className = this.scope.marks.length > 1 ? 'icon-multi-star' : 'icon-star';

            if (this.isActiveHighlights()) {
                this.scope.className += ' red';
            }
        }
    }
}

/**
 * @module superdesk.apps.archive
 * @ngdoc directive
 * @name sdMarkedItemTitle
 * @requires desks
 * @requires authoring
 * @requires highlightServce
 * @requires $filter
 * @requires $location
 * @requires $timeout
 * @description This directive is used in authoring-topbar and item preview to mark a story as a highlight or
 *   to mark it for a desk.
 */
export function MarkedItemTitle(desks, authoring, highlightsService, $filter, $location, $timeout) {
    return {
        scope: {
            item: '=item',
            markField: '@field',
        },
        template: require('scripts/apps/archive/views/marked_item_title.html'),
        link: (scope, elem) => new LinkFunction(desks, authoring,
            highlightsService, $filter, $location, $timeout, scope, elem),
    };
}

MarkedItemTitle.$inject = ['desks', 'authoring', 'highlightsService', '$filter', '$location', '$timeout'];
