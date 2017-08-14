/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdPublishRoutes
 * @requires publisher
 * @description Directive to handle listing routes in web sites monitoring
 */
PublishRoutesDirective.$inject = ['publisher'];
export function PublishRoutesDirective(publisher) {
    class PublishRoutes {
        constructor() {
            this.scope = {site: '=site', monitoringContoller: '=monitoringContoller'};
            this.templateUrl = 'scripts/apps/web-publisher/views/monitoring/publish-routes.html';
        }

        link(scope) {
            this._queryItems(scope);
        }

        /**
         * @ngdoc method
         * @name sdPublishRoutes#_queryItems
         * @private
         * @param {Object} scope
         * @description Loads routes for selected site
         */
        _queryItems(scope) {
            publisher.setTenant(scope.site);
            publisher.queryRoutes({type: 'collection'}).then((routes) => {
                scope.routes = routes;
            });
        }
    }

    return new PublishRoutes();
}
