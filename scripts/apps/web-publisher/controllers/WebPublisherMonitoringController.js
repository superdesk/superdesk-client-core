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

            publisher.queryMonitoringArticles({status: 'new'}).then((articles) => {
                $scope.incomingArticles = articles;
            });
            publisher.queryMonitoringArticles({limit: 100, status: 'published'}).then((articles) => {
                $scope.publishedArticles = articles;
            });

            publisher.querySites().then((sites) => {
                $scope.sites = sites;
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
