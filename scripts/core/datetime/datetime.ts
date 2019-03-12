import _ from 'lodash';
import {gettext} from 'core/utils';

DateTimeDirective.$inject = ['datetime', 'moment'];
function DateTimeDirective(datetime, moment) {
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

ShortDateDirective.$inject = ['config', 'moment'];
function ShortDateDirective(config, moment) {
    var DATE_FORMAT = config.view.dateformat || config.model.dateformat;

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
                var text = momentDate.format(DATE_FORMAT);

                if (momentDate) {
                    elem.text(text);
                    elem.attr('title', text);
                }
            }
        },
    };
}

DateTimeService.$inject = ['moment', 'config'];
function DateTimeService(moment, config) {
    var ISO_DATE_FORMAT = 'YYYY-MM-DD';
    var ISO_WEEK_FORMAT = 'YYYY-W';
    var ISO_YEAR_FORMAT = 'YYYY';

    var LONG_FORMAT = config.longDateFormat || 'LLL';
    var TIME_FORMAT = config.shortTimeFormat || 'hh:mm';
    var DATE_FORMAT = config.shortDateFormat || 'MM/DD';
    var WEEK_FORMAT = config.shortWeekFormat || 'dddd, ' + TIME_FORMAT;
    var ARCHIVE_FORMAT = config.ArchivedDateFormat || DATE_FORMAT;

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

    function isArchiveYear(a, b) {
        return (config.ArchivedDateOnCalendarYear === 1) ?
            a.format(ISO_YEAR_FORMAT) !== b.format(ISO_YEAR_FORMAT) : b.diff(a, 'years') >= 1;
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
            date: momentTS.format(config.model.dateformat),
            time: momentTS.format(config.model.timeformat),
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

    this.mergeDateTime = function(dateStr, timeStr, timezone) {
        var tz = timezone || config.defaultTimezone;
        var mergeStr = dateStr + ' ' + timeStr;
        var formatter = config.model.dateformat + ' ' + config.model.timeformat;

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
    .config(['defaultConfigProvider', function(defaultConfig) {
        defaultConfig.set('shortTimeFormat', 'HH:mm'); // 24h format
    }])

    .directive('sdDatetime', DateTimeDirective)
    .directive('sdShortDate', ShortDateDirective)

    .filter('reldate', ['moment', function reldateFactory(moment) {
        return function reldate(date) {
            return moment(date).fromNow();
        };
    }])

    /**
     * Returns the difference between given date and the
     * current datetime in hours
     *
     * @param {Datetime} date iso format datetime
     * @return {Int} hours
     */
    .filter('hoursFromNow', ['moment', function hoursFromNowFactory(moment) {
        return function hoursFromNow(date) {
            var difference = moment().diff(moment(date));
            var d = moment.duration(difference);
            var s = Math.floor(d.asHours());

            return s;
        };
    }])

    // format datetime obj to time string
    .filter('time', ['config', 'moment', function timeFilterFactory(config, moment) {
        var TIME_FORMAT = config.view ? config.view.timeformat : 'h:mm';

        return function timeFilter(time) {
            var m = moment(time, 'HH:mm:ss');

            return m.format(TIME_FORMAT);
        };
    }])

    .constant('moment', require('moment-timezone'))

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
        var filename = 'scripts/apps/dashboard/world-clock/timezones-all.json',
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
