/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherMonitoringController
 * @requires publisher
 * @requires modal
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherMonitoringController holds a set of functions used for web publisher monitoring
 */
WebPublisherMonitoringController.$inject = ['$scope', 'publisher', 'modal'];
export function WebPublisherMonitoringController($scope, publisher, modal) {
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
            this.selectedRoute = [];
            this.publishOpen = true;
            this.activePublishPane = action;
            this.selectedArticle = article;
            this.selectedRoute.push(article.route);
        }

        publishArticle() {
            publisher.setTenant(this.selectedArticle.tenant.subdomain);

            publisher.publishArticle(
                {article: {status: 'published', route: this.selectedRoute[0].id}}, this.selectedArticle.id)
                .then(() => {
                    this.publishOpen = false;
                    $scope.$broadcast('refreshArticlesList', this.selectedArticle, this.selectedRoute[0].id);
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
    }

    return new WebPublisherMonitoring();
}
