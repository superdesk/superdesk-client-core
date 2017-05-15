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
                let queryParams = scope.rootType && scope.rootType === 'incoming' ?
                {
                    page: page,
                    limit: 20,
                    status: 'new'
                } : {
                    page: page,
                    limit: 20,
                    'status[]': ['published', 'unpublished', 'canceled'],
                    tenant: scope.site ? scope.site.code : undefined,
                    route: scope.route ? scope.route.id : undefined
                };

                publisher.queryMonitoringArticles(queryParams).then((articles) => {
                    scope.totalArticles = articles;
                    scope.articlesList = scope.articlesList.concat(articles._embedded._items);
                    scope.loadingArticles = false;
                });
            };

            scope.$on('refreshArticlesList', (e, updatedDestinations, oldDestinationsRoutes) => {
                if (scope.rootType ||
                    scope.site && _.find(updatedDestinations, {tenant: scope.site.code}) ||
                    scope.route && _.find(updatedDestinations, {route: scope.route.id}) ||
                    scope.route && _.find(oldDestinationsRoutes, {route: scope.route.id})) {
                    scope.loadArticles(true);
                }
            });
        }
    }

    return new GroupArticle();
}
