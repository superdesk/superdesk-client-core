import {gettext} from 'core/utils';

/**
 * Display relative date in <time> element
 *
 * Usage:
 * <span sd-reldate-complex data-useutc="false" datetime="user._created"></span>
 *
 * Params:
 * @param {object} datetime - datetime string in utc
 * @param {boolean} useutc - if true vlues are converted to local datetime
 */
ReldateComplex.$inject = ['config'];
function ReldateComplex(config) {
    var COMPARE_FORMAT = config.model.dateformat;
    var DATE_FORMAT = config.view.dateformat || config.model.dateformat;
    var TIME_FORMAT = config.view.timeformat || config.model.timeformat;
    var DISPLAY_DATE_FORMAT = DATE_FORMAT + ' ' + TIME_FORMAT;
    var DISPLAY_DAY_FORMAT = 'dddd ';
    var DISPLAY_TODAY_FORMAT = '[Today]';

    return {
        scope: {
            datetime: '=',
            useutc: '=',
        },
        template: '<time datetime="{{ datetimeIso }}"><span>{{rday}}, &nbsp;{{ rdate }}</span></time>',
        link: function(scope, element, attrs, ngModel) {
            var useutc = angular.isUndefined(scope.useutc) ? true : !!scope.useutc;

            scope.$watch('datetime', (datetime) => {
                var date = moment.utc(scope.datetime);

                if (useutc) {
                    date.local(); // switch to local time zone
                }

                scope.datetimeIso = date.toISOString();

                if (moment().format(COMPARE_FORMAT) === date.format(COMPARE_FORMAT)) {
                    scope.rday = gettext(date.format(DISPLAY_TODAY_FORMAT));
                } else {
                    scope.rday = date.format(DISPLAY_DAY_FORMAT);
                }

                scope.rdate = date.format(DISPLAY_DATE_FORMAT);
            });
        },
    };
}

angular.module('superdesk.core.datetime.reldatecomplex', []).directive('sdReldateComplex', ReldateComplex);
