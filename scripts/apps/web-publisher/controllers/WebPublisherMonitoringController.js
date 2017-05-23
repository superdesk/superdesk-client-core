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
            this.publishedDestinations = {};
            this.publishFilter = 'all';
            this.publishOpen = true;
            this.unpublishSelectAll = false;
            this.activePublishPane = action;
            this.selectedArticle = article;
            angular.forEach(this.sites, (site) => {
                site.routeEditing = false;
            });
            angular.forEach(article.articles, (item) => {
                this.publishedDestinations[item.tenant.code] =
                {
                    tenant: item.tenant,
                    route: item.route,
                    fbia: item.fbia,
                    status: item.status,
                    updatedAt: item.updatedAt,
                    unpublish: false
                };
            });
            this.newDestinations = angular.copy(this.publishedDestinations);
        }

        publishArticle() {
            angular.forEach(this.newDestinations, (item) => {
                item.unpublish = false;
            });

            let destinations = [];
            let oldDestinationsRoutes = [];
            let updatedKeys = this._updatedKeys(this.newDestinations, this.publishedDestinations);

            angular.forEach(updatedKeys, (item) => {
                if (this.newDestinations[item].route.id) {
                    destinations.push({
                        tenant: item,
                        route: this.newDestinations[item].route.id,
                        fbia: this.newDestinations[item] && this.newDestinations[item].fbia === true});
                }

                if (this.publishedDestinations[item] && this.publishedDestinations[item].route.id) {
                    oldDestinationsRoutes.push({
                        route: this.publishedDestinations[item].route.id});
                }
            });

            if (destinations.length) {
                publisher.publishArticle(
                    {publish: {destinations: destinations}}, this.selectedArticle.id)
                    .then(() => {
                        this.publishOpen = false;
                        $scope.$broadcast('refreshArticlesList', destinations, oldDestinationsRoutes);
                    });
            }
        }

        unpublishAll() {
            angular.forEach(this.newDestinations, (item) => {
                item.unpublish = this.unpublishSelectAll;
            });
        }

        unPublishArticle() {
            let tenants = [];
            let oldDestinationsRoutes = [];
            let updatedKeys = this._updatedKeys(this.newDestinations, this.publishedDestinations);

            angular.forEach(updatedKeys, (item) => {
                if (this.newDestinations[item].unpublish === true) {
                    tenants.push(item);
                    oldDestinationsRoutes.push({
                        route: this.publishedDestinations[item].route.id});
                }
            });

            publisher.unPublishArticle(
                {unpublish: {tenants: tenants}}, this.selectedArticle.id)
                .then(() => {
                    this.publishOpen = false;
                    $scope.$broadcast('refreshArticlesList', tenants, oldDestinationsRoutes);
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
        openArticlePreview(routeId, site) {
            let token = publisher.getToken();

            this.previewArticleUrls = {
                regular: '//' + site.subdomain + '.'
                + site.domainName + '/preview/article/' + routeId
                + '/' + this.selectedArticle.id + '?auth_token=' + token,
                amp: '//' + site.subdomain + '.'
                + site.domainName + '/preview/article/' + routeId
                + '/' + this.selectedArticle.id + '?auth_token=' + token + '&amp'
            };

            this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
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
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
                this.articlePreviewModeReadable = 'Desktop';
                break;
            case 'tablet':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
                this.articlePreviewModeReadable = 'Tablet (portrait)';
                break;
            case 'tablet-landscape':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
                this.articlePreviewModeReadable = 'Tablet (landscape)';
                break;
            case 'mobile':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
                this.articlePreviewModeReadable = 'Mobile (portrait)';
                break;
            case 'mobile-landscape':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.regular);
                this.articlePreviewModeReadable = 'Mobile (landscape)';
                break;
            case 'amp':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.amp);
                this.articlePreviewModeReadable = 'AMP (portrait)';
                break;
            case 'amp-landscape':
                this.previewArticleSrc = $sce.trustAsResourceUrl(this.previewArticleUrls.amp);
                this.articlePreviewModeReadable = 'AMP (landscape)';
                break;
            }
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#_updatedKeys
         * @private
         * @param {Object} a
         * @param {Object} b
         * @returns {Array}
         * @description Compares 2 objects and returns keys of fields that are updated
         */
        _updatedKeys(a, b) {
            return _.reduce(a, (result, value, key) => _.isEqual(value, b[key]) ? result : result.concat(key), []);
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterRemoveDate
         * @param {Number} type - type of date to remove (publishedBefore, publishedAfter)
         * @description Removes date from filters list
         */
        filterRemoveDate(type) {
            delete this.advancedFilters[type];
        }

         /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterRemoveRoute
         * @param {String} tenant code
         * @param {String} routeId - id of route
         * @description Removes route from filters list
         */
        filterRemoveRoute(tenantCode, routeId) {
            this.advancedFilters.sites[tenantCode].routes[routeId].status = false;
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filterRemoveTenant
         * @param {String} tenant code
         * @description Removes tenant from filters list
         */
        filterRemoveTenant(tenantCode) {
            this.advancedFilters.sites[tenantCode].status = false;
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
         * @name WebPublisherMonitoringController#filtersClear
         * @description Clears filters
         */
        filtersClear() {
            this.advancedFilters = {
                sites: {}
            };
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#filtersSave
         * @description Saves user defined filter criteria
         */
        filtersSave() {
            // removing unnecessary elements
            angular.forEach(this.advancedFilters.sites, (site, key) => {
                angular.forEach(site.routes, (route, key) => {
                    if (!route.status) {
                        delete site.routes[key];
                    }
                });
            });

            let settingsObj = {
                settings: {
                    name: 'filtering_prefrences',
                    value: JSON.stringify(this.advancedFilters)
                }
            };

            publisher.saveSettings(settingsObj);
        }

        /**
         * @ngdoc method
         * @name WebPublisherMonitoringController#_setFilters
         * @description Sets user defined advanced filters or default values
         */
        _setFilters(scope) {
            this.advancedFilters = {
                sites: {}
            };

            // request to settings API to load filter preset per user
            publisher.getSettings()
                .then((settings) => {
                    let filteringPreferences = JSON.parse(settings.filtering_prefrences.value);

                    // !!!!!!!!!!!!! TYPO IN API 'PREFERENCES' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    if (!_.isEmpty(filteringPreferences)) {
                        this.advancedFilters = filteringPreferences;
                    }
                });

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
