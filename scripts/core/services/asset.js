export default angular.module('superdesk.core.services.asset', [])
    /**
     * @ngdoc provider
     * @module superdesk.core.services
     * @name assetProvider
     *
     * @requires https://docs.angularjs.org/api/ng/service/$injector $injector
     *
     * @description Asset module. This module provides urls for static assets.
     */
    .provider('asset', ['$injector', function($injector) {
        this.templateUrl = function(path) {
            var config = $injector.get('config'),
                ret = path;

            if (!/^(https?:\/\/|\/\/|\/|.\/|..\/)/.test(path)) {
                ret = 'scripts/' + ret;
            }
            if (!/^(https?:\/\/|\/\/)/.test(path) && config.paths && config.paths.superdesk) {
                ret = config.paths.superdesk + ret;
            }
            ret = ret.replace(/[^\/]+\/+\.\.\//g, '')
                .replace(/\.\//g, '')
                .replace(/(\w)\/\/(\w)/g, '$1/$2');
            return ret;
        };

        this.imageUrl = this.templateUrl;

        /**
         * @ngdoc service
         * @module superdesk.core.services
         * @name asset
         * @description The asset service has no accessible methods and is only
         * available at provider level.
         */
        this.$get = function() {
            return this;
        };
    }]);
