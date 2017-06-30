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
                initialFilters: '=filters'
            };

            this.templateUrl = 'scripts/apps/web-publisher/views/monitoring/group-article.html';
        }

        link(scope) {
            scope.articlesList = [];
            scope.filters = scope.initialFilters ? scope.initialFilters : {};
            scope.loadedFilters = !!scope.initialFilters;

            scope.buildTenantParams = () => {
                let tenant = [];

                if (scope.site) {
                    tenant.push(scope.site.code);
                }

                if (!tenant.length && scope.filters.sites && !_.isEmpty(scope.filters.sites)) {
                    angular.forEach(scope.filters.sites, (site, key) => {
                        if (site.status) {
                            tenant.push(key);
                        }
                    });
                }

                return tenant;
            };

            scope.buildRouteParams = () => {
                let route = [];

                if (scope.route) {
                    route.push(scope.route.id);
                }

                if (!route.length && scope.filters.sites) {
                    angular.forEach(scope.filters.sites, (siteObj, tenantCode) => {
                        if ((!scope.site || scope.site.code === tenantCode) && siteObj.routes) {
                            angular.forEach(siteObj.routes, (routeObj, key) => {
                                if (routeObj.status) {
                                    route.push(key);
                                }
                            });
                        }
                    });
                }

                return route;
            };

            scope.buildUniversalParams = () => {
                let universalParams = {};

                if (scope.filters.author && scope.filters.author.length) {
                    universalParams['author[]'] = scope.filters.author;
                }

                if (scope.filters.source && scope.filters.source.length) {
                    universalParams['source[]'] = scope.filters.source;
                }

                if (scope.filters.term && scope.filters.term.length) {
                    universalParams.term = scope.filters.term;
                }

                return universalParams;
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
                let universal = scope.buildUniversalParams();

                queryParams = Object.assign(queryParams, universal);

                // building query params for both cases
                if (scope.rootType && scope.rootType === 'incoming') {
                    queryParams['status[]'] = ['new'];
                } else {
                    queryParams['status[]'] = ['published', 'unpublished'];
                    queryParams['tenant[]'] = tenant.length ? tenant : undefined;
                    queryParams['route[]'] = route.length ? route : undefined;
                    queryParams.publishedBefore = scope.filters.publishedBefore;
                    queryParams.publishedAfter = scope.filters.publishedAfter;
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

            scope.$on('refreshArticlesList', (e, updatedDestinations, oldDestinationsRoutes, filters) => {
                if (filters) {
                    scope.filters = filters;
                    scope.loadedFilters = true;
                }

                if (filters || scope.rootType ||
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
