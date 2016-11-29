import _ from 'lodash';

MultiService.$inject = ['$rootScope'];
export function MultiService($rootScope) {
    var items = [];

    var self = this;

    /**
     * Test if given item is selected
     *
     * @param {Object} item
     */
    this.isSelected = function(item) {
        return item.selected;
    };

    /**
     * Toggle item selected state
     *
     * @param {Object} item
     */
    this.toggle = function(item) {
        items = _.without(items, _.find(items, identity));
        if (item.selected) {
            items = _.union(items, [item]);
        }

        this.count = items.length;

        function identity(_item) {
            return _item._id === item._id && _item._current_version === item._current_version;
        }
    };

    /**
     * Get list of selected items identifiers
     */
    this.getIds = function() {
        return _.map(items, '_id');
    };

    /**
     * Get list of selected items
     */
    this.getItems = function() {
        return items;
    };

    /**
     * Reset to empty
     */
    this.reset = function() {
        var ids = [];

        _.each(items, function(item) {
            item.selected = false;
            ids.push(item._id);
        });
        items = [];
        this.count = 0;
        $rootScope.$broadcast('multi:reset', {ids: ids}); // let react know
    };

    /**
     * update count on deselection
     * e.g, when selected item gets published, corrected or killed
     */
    this.remove = function(itemId) {
        _.remove(items, {_id: itemId});
        this.count = items.length;
    };

    // main
    this.reset();
    $rootScope.$on('$routeChangeStart', angular.bind(this, this.reset));
    $rootScope.$on('multi:remove', function(_e, itemId) {
        self.remove(itemId);
    });
    $rootScope.$on('item:spike', function(e, data) {
        if (!_.isNil(data)) {
            self.remove(data.item);
        }
    });
    $rootScope.$on('item:unspike', function(e, data) {
        if (!_.isNil(data)) {
            self.remove(data.item);
        }
    });
    $rootScope.$on('item:publish', function(e, data) {
        self.remove(data.item);
    });
    $rootScope.$on('item:move', function(e, data) {
        self.remove(data.item);
    });
}
