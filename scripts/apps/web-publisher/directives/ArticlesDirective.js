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
            this.scope = {type: '@', draggingFlag: '=draggingflag'};
            this.template = '<ng-include src="getTemplateUrl()"/>';
        }

        link(scope) {
            /**
             * @ngdoc method
             * @name sdListArticles#getTemplateUrl
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
                                .concat(list.items.slice(index));

                return true;
            };

            /**
             * @ngdoc method
             * @name sdArticles#onMoved
             * @param {Object} list - list of article items
             * @description Handles move event
             */
            scope.onMoved = (list) => {
                list.items = list.items.filter((item) => !item.selected);
            };


            scope.$on('refreshArticles', (e, data) => {
                let params = {
                    limit: 100,
                    status: 'published'
                };

                if (data.length > 0) {
                    params['route[]'] = [];
                    data.forEach((item) => {
                        params['route[]'].push(item.id);
                    });
                }

                this._queryItems(scope, params);
            });

            this._queryItems(scope, {limit: 100, status: 'published'});
        }

        /**
         * @ngdoc method
         * @name sdArticles#_queryItems
         * @private
         * @param {Object} scope
         * @description Loads items
         */
        _queryItems(scope, params) {
            scope.loading = true;
            publisher.queryTenantArticles(params).then((response) => {
                scope.loading = false;
                scope.list = {
                    dragging: false,
                    items: [],
                };
                scope.list.items = response._embedded._items;
            });
        }
    }

    return new Articles();
}
