import _ from 'lodash';

angular.module('superdesk.core.services.beta', [])

/**
 * Superdesk service for enabling/disabling beta preview in app
 * @deprecated
 */
    .service('betaService', ['$window', '$rootScope', '$q',
        function($window, $rootScope, $q) {
            $rootScope.beta = null;

            this.toggleBeta = angular.noop();

            this.isBeta = function() {
                return $q.resolve($rootScope.beta);
            };
        }])

    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push(BetaTemplateInterceptor);
    }]);

/**
 * Detect beta elements in phase of loading html templates and prevent rendering of those
 */
BetaTemplateInterceptor.$inject = ['$q', '$templateCache', 'betaService'];
function BetaTemplateInterceptor($q, $templateCache, betaService) {
    var modifiedTemplates = {};

    var HAS_FLAGS_EXP = /sd-beta/,
        IS_HTML_PAGE = /\.html$|\.html\?/i;

    return {
        response: function(response) {
            var url = response.config.url;

            if (!modifiedTemplates[url] && IS_HTML_PAGE.test(url) && HAS_FLAGS_EXP.test(response.data)) {
                var template = $('<div>').append(response.data);

                return betaService.isBeta().then((beta) => {
                    if (!beta) {
                        template.find('[sd-beta]').each(function() {
                            $(this).remove();
                        });
                    }

                    response.data = template.html();
                    $templateCache.put(url, response.data);
                    modifiedTemplates[url] = true;
                    return response;
                }, () => {
                    response.data = template.html();
                    $templateCache.put(url, response.data);
                    modifiedTemplates[url] = true;
                    return response;
                });
            }

            return response;
        },
    };
}
