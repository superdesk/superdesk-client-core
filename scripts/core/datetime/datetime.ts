import _ from 'lodash';
import {gettext} from 'core/utils';
import moment from 'moment-timezone';
import {appConfig} from 'appConfig';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const ISO_WEEK_FORMAT = 'YYYY-W';
const ISO_YEAR_FORMAT = 'YYYY';

const LONG_FORMAT = appConfig.longDateFormat || 'LLL';
const TIME_FORMAT = appConfig.shortTimeFormat || 'hh:mm';
const DATE_FORMAT = appConfig.shortDateFormat || 'MM/DD';
const WEEK_FORMAT = appConfig.shortWeekFormat || 'dddd, ' + TIME_FORMAT;
const ARCHIVE_FORMAT = appConfig.ArchivedDateFormat || DATE_FORMAT;

/**
* Get long representation of given datetime
*
* @param {String} d iso format datetime
*/
export function longFormat(d: string): string {
    return moment(d).format(LONG_FORMAT);
}

DateTimeDirective.$inject = ['datetime'];
function DateTimeDirective(datetime) {
    return {
        scope: {date: '=', fromNow: '='},
        link: function datetimeLink(scope, elem) {
            scope.$watch('date', renderDate);

            /**
             * Render relative date within given directive
             *
             * @param {string} date iso date
             */
            function renderDate(date) {
                var momentDate = moment(date);
                var txt = scope.fromNow ? momentDate.fromNow() : datetime.shortFormat(momentDate);

                elem.text(txt);
                elem.attr('title', momentDate.format('LLLL'));
            }
        },
    };
}

ShortDateDirective.$inject = [];
function ShortDateDirective() {
    var CONFIG_DATE_FORMAT = appConfig.view.dateformat || appConfig.model.dateformat;

    return {
        scope: {date: '='},
        link: function dateLink(scope, elem) {
            scope.$watch('date', renderDate);

            /**
             * Render short date within given directive
             *
             * @param {string} date iso date
             */
            function renderDate(date) {
                var momentDate = moment(date);
                var text = momentDate.format(CONFIG_DATE_FORMAT);

                if (momentDate) {
                    elem.text(text);
                    elem.attr('title', text);
                }
            }
        },
    };
}

DateTimeService.$inject = [];
function DateTimeService() {
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
        } else if (isArchiveYear(m, now)) {
            return m.format(ARCHIVE_FORMAT);
        }

        return m.format(DATE_FORMAT);
    };

    this.longFormat = longFormat;

    /**
     * Get date and time format for scheduled datetime
     * Returns time for current day, date and time otherwise
     *
     * @param {String} d iso format datetime
     * @return {String}
     */
    this.scheduledFormat = function(d) {
        var m = moment(d);
        var now = moment();
        const _date = m.format(appConfig.view.dateformat || 'MM/DD'),
            _time = m.format(appConfig.view.timeformat || 'hh:mm');

        if (isSameDay(m, now)) {
            return '@ '.concat(_time);
        }

        return _date.concat(' @ ', _time);
    };

    function isSameDay(a, b) {
        return a.format(ISO_DATE_FORMAT) === b.format(ISO_DATE_FORMAT);
    }

    function isSameWeek(a, b) {
        return a.format(ISO_WEEK_FORMAT) === b.format(ISO_WEEK_FORMAT);
    }

    function isArchiveYear(a, b) {
        return (appConfig.ArchivedDateOnCalendarYear === 1) ?
            a.format(ISO_YEAR_FORMAT) !== b.format(ISO_YEAR_FORMAT) : b.diff(a, 'years') >= 1;
    }
}

DateTimeHelperService.$inject = [];
function DateTimeHelperService() {
    /*
    * @param timestring 2016-03-01T04:45:00+0000
    * @param timezone Europe/London
    */
    this.splitDateTime = function(timestring, timezone) {
        var momentTS = moment.tz(timestring, timezone);

        return {
            date: momentTS.format(appConfig.model.dateformat),
            time: momentTS.format(appConfig.model.timeformat),
        };
    };

    this.isValidTime = function(value, format) {
        var timeFormat = format || appConfig.model.timeformat;

        return moment(value, timeFormat, true).isValid();
    };

    this.isValidDate = function(value, format) {
        var dateFormat = format || appConfig.model.dateformat;

        return moment(value, dateFormat, true).isValid();
    };

    this.mergeDateTime = function(dateStr, timeStr, timezone) {
        var tz = timezone || appConfig.defaultTimezone;
        var mergeStr = dateStr + ' ' + timeStr;
        var formatter = appConfig.model.dateformat + ' ' + appConfig.model.timeformat;

        // return without timezone information, which is stored separately
        return moment.tz(mergeStr, formatter, tz).format('YYYY-MM-DD[T]HH:mm:ss');
    };

    /*
    * @param timestring 2016-03-01T04:45:00+0000.
    */
    this.greaterThanUTC = function(timestring) {
        return moment(timestring, 'YYYY-MM-DDTHH:mm:ssZZ') > moment.utc();
    };

    /**
     * Remove tz info from given datetime
     *
     * it's added automatically on server for every datetime like values
     *
     * @param {String} datetime
     * @return {String}
     */
    this.removeTZ = function(datetime) {
        if (datetime) {
            return datetime.replace('+0000', '').replace('+00:00', '');
        }
    };
}

/**
 * @ngdoc module
 * @module superdesk.core.datetime
 * @name superdesk.core.datetime
 * @packageName superdesk.core
 * @description Superdesk core date & time module.
 */
export default angular.module('superdesk.core.datetime', [
    'superdesk.config',
    'ngResource',
    'superdesk.core.datetime.absdate',
    'superdesk.core.datetime.groupdates',
    'superdesk.core.datetime.relativeDate',
    'superdesk.core.datetime.reldatecomplex',
    'superdesk.core.datetime.reldate',
    'superdesk.core.translate',
])
    .directive('sdDatetime', DateTimeDirective)
    .directive('sdShortDate', ShortDateDirective)

    .filter('reldate', function reldateFactory() {
        return function reldate(date) {
            return moment(date).fromNow();
        };
    })

    /**
     * Returns the difference between given date and the
     * current datetime in hours
     *
     * @param {Datetime} date iso format datetime
     * @return {Int} hours
     */
    .filter('hoursFromNow', function hoursFromNowFactory() {
        return function hoursFromNow(date) {
            var difference = moment().diff(moment(date));
            var d = moment.duration(difference);
            var s = Math.floor(d.asHours());

            return s;
        };
    })

    // format datetime obj to time string
    .filter('time', function timeFilterFactory() {
        var CONFIG_TIME_FORMAT = appConfig.view == null || appConfig.view.timeformat == null
            ? 'h:mm'
            : appConfig.view.timeformat;

        return function timeFilter(time) {
            var m = moment(time, 'HH:mm:ss');

            return m.format(CONFIG_TIME_FORMAT);
        };
    })

    .constant('moment', moment)

    .factory('weekdays', [function() {
        return Object.freeze({
            MON: gettext('Monday'),
            TUE: gettext('Tuesday'),
            WED: gettext('Wednesday'),
            THU: gettext('Thursday'),
            FRI: gettext('Friday'),
            SAT: gettext('Saturday'),
            SUN: gettext('Sunday'),
        });
    }])

    /**
     *   A service that automatically fetches the time zone data from the
     *   server upon instantiaton and stores it internally for future use,
     *   avoiding the need to fetch it again every time when needed.
     */
    .factory('tzdata', ['$resource', function($resource) {
        const tzResource = $resource('scripts/apps/dashboard/world-clock/timezones-all.json');

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
        tzResource.prototype.getTzNames = function() {
            return _.union(
                _.keys(this.zones),
                _.keys(this.links),
            ).sort();
        };

        // return an array that will contain the fetched data when
        // it arrives from the server
        return tzResource.get();
    }])
    .service('datetime', DateTimeService)
    .service('datetimeHelper', DateTimeHelperService);
