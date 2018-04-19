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
        template: '<time datetime="{{ datetimeIso }}" title="{{ title }}">{{ reldate }}</time>',
        link: function(scope) {
            scope.$watch('datetime', (datetime) => {
                var date = moment.utc(scope.datetime);

                date.local(); // switch to local time zone

                scope.datetimeIso = date.toISOString();
                scope.title = date.format('LLLL');
                scope.reldate = date.fromNow();
            });
        },
    };
}]);
