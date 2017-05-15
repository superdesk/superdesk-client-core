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
                });

            $scope.routes = [
                {closed: true, name: 'News',
                    children: [
                        {closed: true, name: 'Sport',
                            children: [
                            {closed: true, name: 'Business'},
                            {closed: true, name: 'Politics'},
                            {closed: true, name: 'Health'}]
                        },
                        {closed: true, name: 'Tech'},
                        {closed: true, name: 'Science'}]
                },
                {closed: true, name: 'Local',
                    children: [
                    {closed: true, name: 'Prague'},
                    {closed: true, name: 'Berlin'},
                    {closed: true, name: 'Belgrade'}]
                },
                {closed: true, name: 'Entertainment'},
                {closed: true, name: 'Gossips'}];
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
    }

    return new WebPublisherMonitoring();
}
