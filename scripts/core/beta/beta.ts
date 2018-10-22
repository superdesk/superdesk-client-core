import _ from 'lodash';

angular.module('superdesk.core.services.beta', ['superdesk.core.preferences'])

/**
 * Superdesk service for enabling/disabling beta preview in app
 */
    .service('betaService', ['$window', '$rootScope', '$q', 'preferencesService',
        function($window, $rootScope, $q, preferencesService) {
            $rootScope.beta = null;

            this.toggleBeta = function() {
                var update = {
                    'feature:preview': {
                        default: false,
                        enabled: !$rootScope.beta,
                        label: 'Enable Feature Preview',
                        type: 'bool',
                        category: 'feature',
                    },
                };

                preferencesService.update(update, 'feature:preview').then(() => {
                    $rootScope.beta = !$rootScope.beta;
                    $window.location.reload();
                });
            };

            this.isBeta = function() {
                if (_.isNil($rootScope.beta)) {
                    return preferencesService.get('feature:preview').then((result) => {
                        $rootScope.beta = result && result.enabled;
                        return $rootScope.beta;
                    }, () => $q.when(false));
                }

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
