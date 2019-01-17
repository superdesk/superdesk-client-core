import {gettext} from 'core/ui/components/utils';

/**
 * Display absolute date in <time> element
 *
 * Usage:
 * <span sd-absdate datetime="user._created"></span>
 *
 * Params:
 * @param {object} datetime - datetime string in utc
 */

angular.module('superdesk.core.datetime.absdate', []).directive('sdAbsdate', [
    function() {
        var COMPARE_FORMAT = 'YYYY-M-D';
        var DISPLAY_DATE_FORMAT = 'D. MMMM YYYY HH:mm';
        var DISPLAY_CDATE_FORMAT = 'D. MMMM HH:mm';
        var DISPLAY_DAY_FORMAT = 'dddd, ';
        var DISPLAY_TODAY_FORMAT = '[' + gettext('Today') + '], ';

        return {
            scope: {
                datetime: '=',
            },
            template: '<time datetime="{{ datetimeIso }}"><span>{{ rday }}{{ rdate }}</span></time>',
            link: function(scope) {
                scope.$watch('datetime', (datetime) => {
                    var date = moment.utc(scope.datetime);

                    date.local(); // switch to local time zone

                    scope.datetimeIso = date.toISOString();

                    if (moment().format(COMPARE_FORMAT) === date.format(COMPARE_FORMAT)) {
                        scope.rday = date.format(DISPLAY_TODAY_FORMAT);
                    } else {
                        scope.rday = date.format(DISPLAY_DAY_FORMAT);
                    }

                    if (moment().format('YYYY') === date.format('YYYY')) {
                        scope.rdate = date.format(DISPLAY_CDATE_FORMAT);
                    } else {
                        scope.rdate = date.format(DISPLAY_DATE_FORMAT);
                    }
                });
            },
        };
    },
]);
