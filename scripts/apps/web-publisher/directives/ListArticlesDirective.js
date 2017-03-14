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
            this.scope = {list: '=list', type: '@'};
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
             * @name sdListArticles#pinArticle
             * @param {Object} article
             * @description Pins article
             */
            scope.pinArticle = (article) => {
                publisher.pinArticle(scope.list.id, article.id, {content_list_item: {sticky: !article.sticky}}).then(
                    (item) => this._queryItems(scope));
            };

            scope.$on('refreshArticles', (e, data) => {
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
            publisher.queryArticles(scope.list.id).then((articles) => {
                scope.loading = false;
                scope.articles = articles;
            });
        }
    }

    return new ListArticles();
}
