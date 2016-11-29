Features.$inject = ['urls'];
function Features(urls) {
    var self = this;

    urls.links().then((links) => {
        angular.extend(self, links);
    });
}

/**
 * @ngdoc module
 * @module superdesk.core.features
 * @name superdesk.core.features
 * @packageName superdesk.core
 * @description Superdesk features module provides information about features
 * that are enabled on the server.
 */
angular.module('superdesk.core.features', ['superdesk.core.api'])
    .service('features', Features);
