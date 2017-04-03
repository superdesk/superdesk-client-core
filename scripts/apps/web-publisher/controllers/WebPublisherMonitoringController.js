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
            $scope.incomingArticles = [];
            $scope.publishedArticles = [];

            publisher.setToken()
                .then(publisher.querySites)
                .then((sites) => {
                    $scope.tokenLoaded = true;
                    $scope.sites = sites;
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

        loadIncoming(reset) {
            if ($scope.loadingIncoming) {
                return;
            }

            let page = $scope.totalIncoming ? $scope.totalIncoming.page + 1 : 1;

            if (reset) {
                page = 1;
                $scope.incomingArticles = [];
            }

            $scope.loadingIncoming = true;
            publisher.queryMonitoringArticles(
                {page: page, limit: 20, status: 'new'}).then((articles) => {
                    $scope.totalIncoming = articles;
                    $scope.incomingArticles = $scope.incomingArticles.concat(articles._embedded._items);
                    $scope.loadingIncoming = false;
                });
        }

        loadPublished(reset) {
            if ($scope.loadingPublished) {
                return;
            }

            let page = $scope.totalPublished ? $scope.totalPublished.page + 1 : 1;

            if (reset) {
                page = 1;
                $scope.publishedArticles = [];
            }

            $scope.loadingPublished = true;
            publisher.queryMonitoringArticles(
                {page: page, limit: 20, 'status[]': ['published', 'unpublished', 'canceled']}).then((articles) => {
                    $scope.totalPublished = articles;
                    $scope.publishedArticles = $scope.publishedArticles.concat(articles._embedded._items);
                    $scope.loadingPublished = false;
                });
        }

        openPublish(article) {
            this.selectedRoute = [];
            this.publishOpen = true;
            this.selectedArticle = article;
            this.selectedRoute.push(article.route);
        }

        publishArticle() {
            publisher.publishArticle(
                {article: {status: 'published', route: this.selectedRoute[0].id}}, this.selectedArticle.id)
                .then(() => {
                    this.publishOpen = false;
                    this.loadIncoming(true);
                    this.loadPublished(true);
                });
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
