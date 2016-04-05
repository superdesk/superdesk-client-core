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

    DateTimeHelperService.$inject = ['moment', 'config'];
    function DateTimeHelperService(moment, config) {

        /*
        * @param timestring 2016-03-01T04:45:00+0000
        * @param timezone Europe/London
        */
        this.splitDateTime = function(timestring, timezone) {
            var momentTS = moment.tz(timestring, timezone);

            return {
                'date': momentTS.format(config.model.dateformat),
                'time': momentTS.format(config.model.timeformat)
            };
        };

        this.isValidTime = function(value, format) {
            var timeFormat = format || config.model.timeformat;
            return moment(value, timeFormat, true).isValid();
        };

        this.isValidDate = function(value, format) {
            var dateFormat = format || config.model.dateformat;
            return moment(value, dateFormat, true).isValid();
        };

        this.mergeDateTime = function(date_str, time_str, timezone) {
            var tz = timezone || config.defaultTimezone;
            var merge_str = date_str + ' ' + time_str;
            var formatter = config.model.dateformat + ' ' + config.model.timeformat;

            // return without timezone information, which is stored separately
            return moment.tz(merge_str, formatter, tz).format('YYYY-MM-DD[T]HH:mm:ss');
        };

        /*
        * @param timestring 2016-03-01T04:45:00+0000.
        */
        this.greaterThanUTC = function(timestring) {
            return moment(timestring, 'YYYY-MM-DDTHH:mm:ssZZ') > moment.utc();
        };
    }

    return angular.module('superdesk.datetime', [
        'ngResource',
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
        .filter('time', ['config', function timeFilterFactory(config) {
            var TIME_FORMAT = config.view ? config.view.timeformat : 'h:mm';
            return function timeFilter(time) {
                var m = moment(time, 'HH:mm:ss');
                return m.format(TIME_FORMAT);
            };
        }])

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

        /**
         *   A service that automatically fetches the time zone data from the
         *   server upon instantiaton and stores it internally for future use,
         *   avoiding the need to fetch it again every time when needed.
         */
        .factory('tzdata', ['$resource', function ($resource) {
            var filename = 'scripts/superdesk-dashboard/world-clock/timezones-all.json',
                    tzResource = $resource(filename);

            /**
             * Returns a sorted list of all time zone names. If time zone data
             * has not yet been fetched from the server, an empty list is
             * returned.
             * To determine whether or not the data has been fetched yet, the
             * $promise property should be examined.
             *
             * @method getTzNames
             * @return {Array} a list of time zone names
             */
            tzResource.prototype.getTzNames = function () {
                return _.union(
                        _.keys(this.zones),
                        _.keys(this.links)
                        ).sort();
            };

            // return an array that will contain the fetched data when
            // it arrives from the server
            return tzResource.get();
        }])
        .service('datetime', DateTimeService)
        .service('datetimeHelper', DateTimeHelperService);
})();
