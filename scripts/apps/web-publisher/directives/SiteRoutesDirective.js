/**
 * @ngdoc directive
 * @module superdesk.apps.web_publisher
 * @name sdSiteRoutes
 * @requires publisher
 * @description Directive to handle listing routes in web sites manager
 */
SiteRoutesDirective.$inject = ['publisher'];
export function SiteRoutesDirective(publisher) {
<<<<<<< 74e0478b76f5eb0aa430c205da2123848c6b8305
    class SiteRoutes {
=======

    class SiteRoutes {

>>>>>>> Added listing routes on web site management
        constructor() {
            this.scope = {site: '=site'};
            this.templateUrl = 'scripts/apps/web-publisher/views/site-routes.html';
        }

        link(scope) {
<<<<<<< 74e0478b76f5eb0aa430c205da2123848c6b8305
            scope.$on('refreshRoutes', (e, data) => {
=======
            scope.$on('refreshRoutes', function(e, data) {
>>>>>>> Added listing routes on web site management
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
            publisher.setTenant(scope.site.subdomain);
<<<<<<< 74e0478b76f5eb0aa430c205da2123848c6b8305
            publisher.queryRoutes({type: 'collection'}).then((routes) => {
=======
            publisher.queryRoutes({type: 'collection'}).then(routes => {
>>>>>>> Added listing routes on web site management
                scope.loading = false;
                scope.routes = routes;
            });
        }
    }

    return new SiteRoutes();
}
