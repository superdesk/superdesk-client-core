/**
* @ngdoc factory
* @module superdesk.core.services
* @name imageFactory
*
* @description Factory for creating Image objects. Allows for easier mocking in tests.
*/
export default angular.module('superdesk.core.services.imageFactory', []).factory('imageFactory',
    () => ({
        makeInstance: function() {
            return new Image();
        },
    })
);
