Features.$inject = ['urls'];
function Features(urls) {
    var self = this;
    urls.links().then(function(links) {
        angular.extend(self, links);
    });
}

/**
 * Provides info what features are available on server
 */
angular.module('superdesk.core.features', ['superdesk.core.api'])
    .service('features', Features);
