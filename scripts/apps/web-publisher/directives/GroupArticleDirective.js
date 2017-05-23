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
                loadArticles: '=loadArticles',
                initialFilters: '=filters'
            };
            this.templateUrl = 'scripts/apps/web-publisher/views/monitoring/group-article.html';
        }

        link(scope) {
            scope.articlesList = [];
            scope.filters = scope.initialFilters ? scope.initialFilters : {};

            scope.buildTenantParams = () => {
                // tenant param
                let tenant = [];

                if (scope.site) {
                    tenant.push(scope.site.code);
                }

                if (!tenant.length && scope.filters.hasOwnProperty('sites') && !_.isEmpty(scope.filters.sites)) {
                    angular.forEach(scope.filters.sites, (site, key) => {
                        if (site.hasOwnProperty('status') && site.status) {
                            tenant.push(key);
                        }
                    });
                }

                return tenant;
            };

            scope.buildRouteParams = () => {
                // route param
                let route = [];

                if (scope.route) {
                    route.push(scope.route.id);
                }

                if (!route.length && scope.filters.hasOwnProperty('sites')) {
                    angular.forEach(scope.filters.sites, (siteObj, tenantCode) => {
                        if ((!scope.site || scope.site.code === tenantCode) && siteObj.hasOwnProperty('routes')) {
                            angular.forEach(siteObj.routes, (routeObj, key) => {
                                if (routeObj.hasOwnProperty('status') && routeObj.status) {
                                    route.push(key);
                                }
                            });
                        }
                    });
                }

                return route;
            };

            scope.buildQueryParams = (reset) => {
                let page = reset || !scope.totalArticles ? 1 : scope.totalArticles.page + 1;
                let queryParams = {
                    page: page,
                    limit: 20,
                    'status[]': [],
                    'sorting[updatedAt]': 'desc'
                };

                let route = scope.buildRouteParams();
                let tenant = scope.buildTenantParams();

                // building query params for both cases
                if (scope.rootType && scope.rootType === 'incoming') {
                    queryParams['status[]'] = ['new'];
                } else {
                    queryParams['status[]'] = ['published', 'unpublished', 'canceled'];
                    if (tenant.length) {
                        queryParams['tenant[]'] = tenant;
                    }
                    if (route.length) {
                        queryParams['route[]'] = route;
                    }

                    queryParams.publishedBefore = scope.filters.hasOwnProperty('publishedBefore') ?
                    scope.filters.publishedBefore : undefined;
                    queryParams.publishedAfter = scope.filters.hasOwnProperty('publishedAfter') ?
                    scope.filters.publishedAfter : undefined;
                }

                // universal author and source params
                if (scope.filters.hasOwnProperty('author') && scope.filters.author.length) {
                    queryParams['author[]'] = scope.filters.author;
                }
                if (scope.filters.hasOwnProperty('source') && scope.filters.source.length) {
                    queryParams['source[]'] = scope.filters.source;
                }

                return queryParams;
            };

            scope.loadArticles = (reset) => {
                if (scope.loadingArticles) {
                    return;
                }

                if (reset) {
                    scope.articlesList = [];
                }

                scope.loadingArticles = true;
                let queryParams = scope.buildQueryParams(reset);

                publisher.queryMonitoringArticles(queryParams).then((articles) => {
                    scope.totalArticles = articles;
                    scope.articlesList = scope.articlesList.concat(articles._embedded._items);
                    scope.loadingArticles = false;
                });
            };

            scope.$on('updateMonitoringFilters', (e, filters) => {
                scope.filters = filters;
                scope.loadArticles(true);
            });

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
