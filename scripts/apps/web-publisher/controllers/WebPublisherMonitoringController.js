/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherMonitoringController
 * @requires publisher
 * @requires modal
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherMonitoringController holds a set of functions used for web publisher monitoring
 */
WebPublisherMonitoringController.$inject = ['$scope', '$sce', 'publisher', 'modal'];
export function WebPublisherMonitoringController($scope, $sce, publisher, modal) {
    class WebPublisherMonitoring {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';

            publisher.setToken()
                .then(publisher.querySites)
                .then((sites) => {
                    $scope.loadArticles = true;
                    this.sites = sites;
                    // loading routes for filter pane
                    angular.forEach(this.sites, (siteObj, key) => {
                        publisher.setTenant(siteObj.subdomain);
                        publisher.queryRoutes({type: 'collection'}).then((routes) => {
                            siteObj.routes = routes;
                        });
                    });
                    // "reset" tenant
                    publisher.setTenant('');

                    this._setFilters($scope);
                });
        }

        openPublish(article, action) {
            this.selectedRoute = article.route;
            this.publishOpen = true;
            this.activePublishPane = action;
            this.selectedArticle = article;
        }

        publishArticle() {
            publisher.setTenant(this.selectedArticle.tenant.subdomain);

            publisher.publishArticle(
                {article: {status: 'published', route: this.selectedRoute.id}}, this.selectedArticle.id)
                .then(() => {
                    this.publishOpen = false;
                    $scope.$broadcast('refreshArticlesList', this.selectedArticle, this.selectedRoute.id);
                });
        }

        viewTenantArticles() {
            this.tenantArticles = true;
        }

        viewRouteArticles(site) {
            this.routeArticles = true;
            $scope.loadArticles = false;
            publisher.setTenant(site.subdomain);
            publisher.queryRoutes({type: 'collection'}).then((routes) => {
                $scope.loadArticles = true;
                this.routes = routes;
            });
        }

        viewMonitoringHome() {
            if (this.routeArticles) {
                this.routeArticles = null;
                return;
            }

            this.tenantArticles = null;
        }

        filterTenantArticles(tenant) {
            publisher.setTenant(tenant);
            publisher.queryTenantArticles().then((articles) => {
                $scope.publishedArticles = articles;
            });
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#openArticlePreview
         * @param {Object} tenant
         * @description Opens modal window for previewing article
         */
        openArticlePreview(tenant) {
            // TODO: pass route id here
            let src = 'http://magazine.s-lab.sourcefabric.org/business/kogi-truffaut-vaporware';

            this.previewArticleSrc = $sce.trustAsResourceUrl(src);
            this.openArticlePreviewModal = true;
            this.setArticlePreviewMode('desktop');
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#setArticlePreviewMode
         * @param {String} mode - article preview mode (desktop, tablet, mobile etc)
         * @description Sets type/mode of article preview
         */
        setArticlePreviewMode(mode) {
            this.articlePreviewMode = mode;
            switch (mode) {
            case 'desktop':
                this.articlePreviewModeReadable = 'Desktop';
                break;
            case 'tablet':
                this.articlePreviewModeReadable = 'Tablet (portrait)';
                break;
            case 'tablet-landscape':
                this.articlePreviewModeReadable = 'Tablet (landscape)';
                break;
            case 'mobile':
                this.articlePreviewModeReadable = 'Mobile (portrait)';
                break;
            case 'mobile-landscape':
                this.articlePreviewModeReadable = 'Mobile (landscape)';
                break;
            case 'amp':
                this.articlePreviewModeReadable = 'AMP (portrait)';
                break;
            case 'amp-landscape':
                this.articlePreviewModeReadable = 'AMP (landscape)';
                break;
            }
        }


        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterRemoveAuthor
         * @param {Number} index - index of the item to remove
         * @description Removes author from filters list
         */
        filterRemoveAuthor(index) {
            this.advancedFilters.author.splice(index, 1);
        }

         /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterAddAuthor
         * @description Adds author in criteria filters list
         */
        filterAddAuthor() {
            if (!this.advancedFilters.author) {
                this.advancedFilters.author = [];
            }

            this.advancedFilters.author.push('');
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterRemoveSource
         * @param {Number} index - index of the item to remove
         * @description Removes source from filters list
         */
        filterRemoveSource(index) {
            this.advancedFilters.source.splice(index, 1);
        }

         /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterAddSource
         * @description Adds source in criteria filters list
         */
        filterAddSource() {
            if (!this.advancedFilters.source) {
                this.advancedFilters.source = [];
            }

            this.advancedFilters.source.push('');
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#_setFilters
         * @description Sets user defined advanced filters (todo)
         */
        _setFilters(scope) {
            // TODO: request to user API to load filter preset per user
            this.advancedFilters = {
                sites: [],
                routes: []
            };

            scope.$watch(() => this.advancedFilters, (newVal, oldVal) => {
                /**
                 * @ngdoc event
                 * @name WebPublisherMonitoringController#refreshArticles
                 * @eventType broadcast on $scope
                 * @param {Object} advancedFilters - filters to filter articles
                 * @description event is thrown when advanced filters are changed
                 */
                $scope.$broadcast('refreshArticles', this.advancedFilters);
            }, true);
        }
    }

    return new WebPublisherMonitoring();
}
