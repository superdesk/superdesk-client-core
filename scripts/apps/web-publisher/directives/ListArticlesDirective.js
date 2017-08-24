/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdListArticles
 * @requires publisher
 * @description Directive to handle listing articles in web lists
 */
ListArticlesDirective.$inject = ['publisher'];
export function ListArticlesDirective(publisher) {
    class ListArticles {
        constructor() {
            this.scope = {list: '=list', type: '@', draggingFlag: '=draggingflag', listChangeFlag: '=listchangeflag'};
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
                case 'card':
                    return 'scripts/apps/web-publisher/views/list-articles-card.html';
                case 'detail':
                    return 'scripts/apps/web-publisher/views/list-articles-detail.html';
                case 'draggable':
                    return 'scripts/apps/web-publisher/views/list-articles-draggable.html';
                }
            };

            /**
             * @ngdoc method
             * @name sdListArticles#getSelectedItemsIncluding
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
             * @name sdListArticles#onDragstart
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
             * @name sdListArticles#onDragEnd
             * @param {Object} list - list of article items
             * @description Handles end of dragging
             */
            scope.onDragEnd = (list) => {
                list.dragging = false;
                scope.draggingFlag = false;
            };

            /**
             * @ngdoc method
             * @name sdListArticles#onDrop
             * @param {Object} list - list of article items
             * @param {Array} items - dropped items
             * @param {Int} index - index of list where items were dropped
             * @returns {Boolean}
             * @description Handles drop event
             */
            scope.onDrop = (list, items, index) => {
                scope.draggingFlag = false;
                scope.listChangeFlag = true;
                if (!list.updatedItems) {
                    list.updatedItems = [];
                }

                angular.forEach(items, (item) => {
                    let selectedItemId = item.content ? item.content.id : item.id;

                    item.selected = false;
                    if (!_.find(list.updatedItems, {content_id: selectedItemId})) {
                        let itemAction = item.content ? 'move' : 'add';

                        list.updatedItems.push({content_id: selectedItemId, action: itemAction});
                    }
                });

                list.items = list.items.slice(0, index)
                                .concat(items)
                                .concat(list.items.slice(index))
                                .filter((item) => !item.selected);

                for (let i = 0; i < list.updatedItems.length; i++) {
                    let itemInList = _.find(list.items, {content: {id: list.updatedItems[i].content_id}}) ||
                         _.find(list.items, {id: list.updatedItems[i].content_id});

                    list.updatedItems[i].position = list.items.indexOf(itemInList);
                }

                return true;
            };

            /**
             * @ngdoc method
             * @name sdListArticles#removeFromList
             * @param {Int} index
             * @description Removes article from list
             */
            scope.removeFromList = (index) => {
                let deletedItem;
                let selectedItemId;
                let updatedItem;

                if (!scope.list.updatedItems) {
                    scope.list.updatedItems = [];
                }

                deletedItem = scope.list.items.splice(index, 1);
                selectedItemId = deletedItem[0].content ? deletedItem[0].content.id : deletedItem[0].id;
                updatedItem = _.find(scope.list.updatedItems, {content_id: selectedItemId});
                if (!updatedItem) {
                    scope.list.updatedItems.push({content_id: selectedItemId, action: 'delete'});
                } else {
                    scope.list.updatedItems.splice(scope.list.updatedItems.indexOf(updatedItem), 1);
                }
                scope.listChangeFlag = true;
            };

            /**
             * @ngdoc method
             * @name sdListArticles#pinArticle
             * @param {Object} article
             * @description Pins article
             */
            scope.pinArticle = (article) => {
                publisher.pinArticle(scope.list.id, article.id, {content_list_item: {sticky: !article.sticky}}).then(
                    (item) => this._queryItems(scope));
            };

            scope.$on('refreshListArticles', (e, data) => {
                if (data.id === scope.list.id) {
                    this._queryItems(scope);
                }
            });

            this._queryItems(scope);
        }

        /**
         * @ngdoc method
         * @name sdListArticles#_queryItems
         * @private
         * @param {Object} scope
         * @description Loads items for selected list
         */
        _queryItems(scope) {
            scope.loading = true;
            publisher.queryListArticles(scope.list.id).then((articles) => {
                scope.loading = false;
                if (scope.type === 'draggable') {
                    scope.list.items = articles;
                } else {
                    scope.articles = articles;
                }
            });
        }
    }

    return new ListArticles();
}
