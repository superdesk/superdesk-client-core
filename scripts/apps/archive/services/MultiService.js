import _ from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.apps.archive
 * @name multi
 * @requires $rootScope
 * @description Multi Service keeps track of multiple selections
 */
MultiService.$inject = ['$rootScope'];
export function MultiService($rootScope) {
    var items = [];
    var self = this;
    var findItem = (item) => _.find(items, (i) => i._id === item._id && i._current_version === item._current_version);

    /**
     * @ngdoc method
     * @name multi#isSelected
     * @public
     * @description Checks if given item is selected
     * @param {Object} item - story
     * @returns {Boolean}
     */
    this.isSelected = function(item) {
        return _.size(findItem(item)) > 0;
    };

    /**
     * @ngdoc method
     * @name multi#toggle
     * @public
     * @description Toggles the given item selected state
     * @param {Object} item - story
     */
    this.toggle = function(item) {
        items = _.without(items, findItem(item));
        if (item.selected) {
            items = _.union(items, [item]);
        }

        this.count = items.length;
    };

    /**
     * @ngdoc method
     * @name multi#getIds
     * @public
     * @description Returns list of selected item identifiers
     * @returns {Array} item ids
     */
    this.getIds = function() {
        return _.map(items, '_id');
    };

    /**
     * @ngdoc method
     * @name multi#getItems
     * @public
     * @description Returns list of selected items
     * @returns {Array} items
     */
    this.getItems = function() {
        return items;
    };

    /**
     * @ngdoc method
     * @name multi#reset
     * @public
     * @description Resets selected items
     */
    this.reset = function() {
        var ids = [];

        _.each(items, (item) => {
            item.selected = false;
            ids.push(item._id);
        });
        items = [];
        this.count = 0;
        $rootScope.$broadcast('multi:reset', {ids: ids}); // let react know
    };

    /**
     * @ngdoc method
     * @name multi#remove
     * @public
     * @description Removes the item and updates count on deselection
     * @param {string} item id
     */
    this.remove = function(itemId) {
        _.remove(items, {_id: itemId});
        this.count = items.length;
    };

    // main
    this.reset();
    $rootScope.$on('$routeChangeStart', angular.bind(this, this.reset));
    $rootScope.$on('multi:remove', (_e, itemId) => {
        self.remove(itemId);
    });
    $rootScope.$on('item:spike', (e, data) => {
        if (!_.isNil(data)) {
            self.remove(data.item);
        }
    });
    $rootScope.$on('item:unspike', (e, data) => {
        if (!_.isNil(data)) {
            self.remove(data.item);
        }
    });
    $rootScope.$on('item:publish', (e, data) => {
        self.remove(data.item);
    });
    $rootScope.$on('item:move', (e, data) => {
        self.remove(data.item);
    });
}
