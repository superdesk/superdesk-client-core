import _ from 'lodash';

export default angular.module('superdesk.core.directives.withParams', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdWithParams
     *
     * @requires locationParams
     *
     * @param {String} exclude URL parameters to exclude (separated by comma).
     *
     * @description Manipulates href attribute to include current parameters.
     *
     * Example:
     * ```html
     * <a href="#/users/{{ user._id }}" sd-with-params data-exclude="id,date"></a>
     * ```
     */
    .directive('sdWithParams', ['locationParams', function(locationParams) {
        return {
            compile: function(element, attrs, transclude) {
                if (attrs.exclude) {
                    var excludes = attrs.exclude.split(',');
                    var query = locationParams.makeQuery(
                        _.omit(locationParams.params, excludes),
                        locationParams.defaults,
                    );

                    attrs.$set('href', attrs.href.trim() + query);
                } else {
                    attrs.$set('href', attrs.href.trim() + locationParams.getQuery());
                }
            },
        };
    }]);
