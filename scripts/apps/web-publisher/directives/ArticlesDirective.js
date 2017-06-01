/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdArticles
 * @requires publisher
 * @description Directive to handle listing articles in web
 */
ArticlesDirective.$inject = ['publisher'];
export function ArticlesDirective(publisher) {
    class Articles {
        constructor() {
            this.scope = {type: '@', draggingFlag: '=draggingflag', scrollContainer: '=scrollcontainer'};
            this.template = '<ng-include src="getTemplateUrl()"/>';
        }

        link(scope) {
            scope.params = {
                limit: 20,
                status: 'published',
                page: 1,
                'sorting[createdAt]': 'desc'
            };

            scope.list = {
                dragging: false,
                items: [],
                totalPages: 1,
                page: 0
            };

            /**
             * @ngdoc method
             * @name sdArticles#getTemplateUrl
             * @returns {String}
             * @description Returns template url dependent on type
             */
            scope.getTemplateUrl = function() {
                switch (scope.type) {
                case 'draggable':
                    return 'scripts/apps/web-publisher/views/articles-draggable.html';
                default:
                    return 'scripts/apps/web-publisher/views/articles-detail.html';

                }
            };

            /**
             * @ngdoc method
             * @name sdArticles#getSelectedItemsIncluding
             * @param {Object} list - list of article items
             * @param {Object} item - article item
             * @returns {Object}
             * @description Returns list with updated selected items
             */
            scope.getSelectedItemsIncluding = (list, item) => {
                item.selected = true;
                return list.items.filter((item) => item.selected);
            };

            /**
             * @ngdoc method
             * @name sdArticles#onDragstart
             * @param {Object} list - list of article items
             * @param {Object} event - drag event
             * @description Handles start of dragging
             */
            scope.onDragstart = (list, event) => {
                list.dragging = true;
                scope.draggingFlag = true;
            };

            /**
             * @ngdoc method
             * @name sdArticles#onDragEnd
             * @param {Object} list - list of article items
             * @description Handles end of dragging
             */
            scope.onDragEnd = (list) => {
                list.dragging = false;
                scope.draggingFlag = false;
            };

            /**
             * @ngdoc method
             * @name sdArticles#onDrop
             * @param {Object} list - list of article items
             * @param {Array} items - dropped items
             * @param {Int} index - index of list where items were dropped
             * @returns {Boolean}
             * @description Handles drop event
             */
            scope.onDrop = (list, items, index) => {
                scope.draggingFlag = false;

                angular.forEach(items, (item) => {
                    item.selected = false;
                });

                list.items = list.items.slice(0, index)
                                .concat(items)
                                .concat(list.items.slice(index))
                                .filter((item) => !item.selected);

                return true;
            };

            /**
             * @ngdoc method
             * @name sdArticles#loadMore
             * @description loads more items
             */
            scope.loadMore = () => {
                if (scope.loading || scope.list.page >= scope.list.totalPages) {
                    return;
                }

                scope.params.page = scope.list.page + 1;
                this._queryItems(scope);
            };

            scope.$on('refreshArticles', (e, filters) => {
                scope.params = filters;
                scope.params.page = 1;
                scope.params.includeSubRoutes = true;

                this._queryItems(scope);
            });

            if (scope.type !== 'draggable') {
                this._queryItems(scope);
            }
        }

        /**
         * @ngdoc method
         * @name sdArticles#_queryItems
         * @private
         * @param {Object} scope
         * @description Loads items
         */
        _queryItems(scope) {
            scope.loading = true;
            publisher.queryTenantArticles(scope.params).then((response) => {
                scope.loading = false;
                scope.list.page = response.page;
                scope.list.totalPages = response.pages;
                scope.list.items = response.page > 1 ?
                    scope.list.items.concat(response._embedded._items) :
                    response._embedded._items;
            });
        }
    }

    return new Articles();
}
