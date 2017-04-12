/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdGroupArticle
 * @requires publisher
 * @description Directive list articles by group in monitoring
 */
GroupArticleDirective.$inject = ['publisher'];
export function GroupArticleDirective(publisher) {
    class GroupArticle {
        constructor() {
            this.scope = {
                rootType: '@',
                site: '=site',
                route: '=route',
                webPublisherMonitoring: '=webPublisherMonitoring',
                loadArticles: '=loadArticles'
            };
            this.templateUrl = 'scripts/apps/web-publisher/views/monitoring/group-article.html';
        }

        link(scope) {
            scope.articlesList = [];

            scope.loadArticles = (reset) => {
                if (scope.loadingArticles) {
                    return;
                }

                if (reset) {
                    scope.articlesList = [];
                }

                scope.loadingArticles = true;

                let page = reset || !scope.totalArticles ? 1 : scope.totalArticles.page + 1;
                let queryFunction = scope.rootType ? publisher.queryMonitoringArticles : publisher.queryTenantArticles;
                let queryParams = scope.rootType && scope.rootType === 'incoming' ?
                {
                    page: page,
                    limit: 20,
                    status: 'new'
                } : {
                    page: page,
                    limit: 20,
                    'status[]': ['published', 'unpublished', 'canceled'],
                    route: scope.route ? scope.route.id : undefined
                };

                if (scope.site && !scope.route) {
                    publisher.setTenant(scope.site.subdomain);
                }

                queryFunction(queryParams).then((articles) => {
                    scope.totalArticles = articles;
                    scope.articlesList = scope.articlesList.concat(articles._embedded._items);
                    scope.loadingArticles = false;
                });
            };

            scope.$on('refreshArticlesList', (e, selectedArticle, routeId, rootType) => {
                if (scope.rootType ||
                    scope.site && scope.site.subdomain === selectedArticle.tenant.subdomain ||
                    scope.route && scope.route.id === routeId ||
                    scope.route && scope.route.id === selectedArticle.route.id) {
                    scope.loadArticles(true);
                }
            });
        }
    }

    return new GroupArticle();
}
