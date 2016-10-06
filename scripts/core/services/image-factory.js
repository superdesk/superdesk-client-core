/**
* Factory for creating Image objects. Allows for easier mocking in tests.
*
* @class imageFactory
*/
export default angular.module('superdesk.core.services.imageFactory' , []).factory('imageFactory',
    function () {
        return {
            makeInstance: function () {
                return new Image();
            }
        };
    }
);
