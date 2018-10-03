/**
 * Display relative date in <time> element
 *
 * Usage:
 * <span sd-reldate datetime="user._created"></span>
 *
 * Params:
 * @param {object} datetime - datetime string in utc
 */
angular.module('superdesk.core.datetime.reldate', []).directive('sdReldate', [function() {
    return {
        scope: {datetime: '='},
        template: '<relative-date datetime="datetime"></relative-date>',
    };
}]);
