(function() {
    'use strict';

    DateTimeDirective.$inject = ['datetime', 'moment'];
    function DateTimeDirective(datetime, moment) {
        return {
            scope: {date: '='},
            link: function datetimeLink(scope, elem) {
                scope.$watch('date', renderDate);

                /**
                 * Render relative date within given directive
                 *
                 * @param {string} date iso date
                 */
                function renderDate(date) {
                    var momentDate = moment(date);
                    elem.text(datetime.shortFormat(momentDate));
                    elem.attr('title', momentDate.format('LLLL'));
                }
            }
        };
    }

    DateTimeService.$inject = ['moment', 'weekdays', 'config'];
    function DateTimeService(moment, weekdays, config) {

        var ISO_DATE_FORMAT = 'YYYY-MM-DD';
        var ISO_WEEK_FORMAT = 'YYYY-W';

        var LONG_FORMAT = config.longDateFormat || 'LLL';
        var TIME_FORMAT = config.shortTimeFormat || 'hh:mm';
        var DATE_FORMAT = config.shortDateFormat || 'MM/DD';
        var WEEK_FORMAT = config.shortWeekFormat || 'dddd, ' + TIME_FORMAT;

        /**
         * Get short representation of given datetime
         *
         * It returns time for current day, day + time for current week, date otherwise.
         *
         * @param {String} d iso format datetime
         * @return {String}
         */
        this.shortFormat = function(d) {
            var m = moment(d);
            var now = moment();

            if (isSameDay(m, now)) {
                return m.format(TIME_FORMAT);
            } else if (isSameWeek(m, now)) {
                return m.format(WEEK_FORMAT);
            } else {
                return m.format(DATE_FORMAT);
            }
        };

        /**
         * Get long representation of given datetime
         *
         * @param {String} d iso format datetime
         * @return {String}
         */
        this.longFormat = function(d) {
            return moment(d).format(LONG_FORMAT);
        };

        function isSameDay(a, b) {
            return a.format(ISO_DATE_FORMAT) === b.format(ISO_DATE_FORMAT);
        }

        function isSameWeek(a, b) {
            return a.format(ISO_WEEK_FORMAT) === b.format(ISO_WEEK_FORMAT);
        }
    }

    return angular.module('superdesk.datetime', [
        'superdesk.datetime.absdate',
        'superdesk.datetime.groupdates',
        'superdesk.datetime.reldatecomplex',
        'superdesk.datetime.reldate',
        'superdesk.translate'
    ])
        .directive('sdDatetime', DateTimeDirective)

        .filter('reldate', function reldateFactory() {
            return function reldate(date) {
                return moment(date).fromNow();
            };
        })

        // format datetime obj to time string
        .filter('time', function timeFilterFactory() {
            return function timeFilter(date) {
                return moment(date).format('h:mm');
            };
        })

        .constant('moment', moment)

        .factory('weekdays', ['gettext', function(gettext) {
            return Object.freeze({
                MON: gettext('Monday'),
                TUE: gettext('Tuesday'),
                WED: gettext('Wednesday'),
                THU: gettext('Thursday'),
                FRI: gettext('Friday'),
                SAT: gettext('Saturday'),
                SUN: gettext('Sunday')
            });
        }])

        .service('datetime', DateTimeService)

        ;

})();
