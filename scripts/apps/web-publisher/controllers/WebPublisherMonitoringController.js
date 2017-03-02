/**
TEMPORARY
I needed this only for TEMPLATES_DIR variable.
 */

WebPublisherMonitoringController.$inject = ['$scope', 'publisher', 'modal'];
export function WebPublisherMonitoringController($scope, publisher, modal) {
    class WebPublisherMonitoring {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
        }
    }

    return new WebPublisherMonitoring();
}
