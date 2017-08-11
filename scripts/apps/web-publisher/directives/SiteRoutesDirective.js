/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdSiteRoutes
 * @requires publisher
 * @description Directive to handle listing routes in web sites manager
 */
SiteRoutesDirective.$inject = ['publisher'];
export function SiteRoutesDirective(publisher) {
    class SiteRoutes {
        constructor() {
            this.scope = {site: '=site'};
            this.templateUrl = 'scripts/apps/web-publisher/views/site-routes.html';
        }

        link(scope) {
            scope.$on('refreshRoutes', (e, data) => {
                if (data === scope.site.subdomain) {
                    this._queryItems(scope);
                }
            });

            this._queryItems(scope);
        }

        /**
         * @ngdoc method
         * @name sdSiteRoutes#_queryItems
         * @private
         * @param {Object} scope
         * @description Loads routes for selected site
         */
        _queryItems(scope) {
            scope.loading = true;
            publisher.setTenant(scope.site);
            publisher.queryRoutes({type: 'collection'}).then((routes) => {
                scope.loading = false;
                scope.routes = routes;
            });
        }
    }

    return new SiteRoutes();
}
