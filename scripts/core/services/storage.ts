angular.module('superdesk.core.services.storage', [])
    /**
     * @ngdoc service
     * @module superdesk.core.services
     * @name storage
     *
     * @description
     * LocalStorage wrapper
     *
     * it stores data as json to keep its type
     */
    .service('storage', function() {
        /**
         * @ngdoc method
         * @name storage#getItem
         * @public
         *
         * @param {String} key
         * @returns {Object}
         *
         * @description Get item from storage
         */
        this.getItem = function(key) {
            return angular.fromJson(localStorage.getItem(key));
        };

        /**
         * @ngdoc method
         * @name storage#setItem
         * @public
         *
         * @param {String} key
         * @param {Object} data
         *
         * @description Set storage item
         */
        this.setItem = function(key, data) {
            localStorage.setItem(key, angular.toJson(data));
        };

        /**
         * @ngdoc method
         * @name storage#removeItem
         * @public
         *
         * @param {String} key
         *
         * @description Remove item from storage.
         */
        this.removeItem = function(key) {
            localStorage.removeItem(key);
        };

        /**
         * @ngdoc method
         * @name storage#clear
         * @public
         *
         * @description Remove all items from storage.
         */
        this.clear = function() {
            localStorage.clear();
        };
    });
