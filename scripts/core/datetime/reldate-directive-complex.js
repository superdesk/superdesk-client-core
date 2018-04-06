/**
 * Display relative date in <time> element
 *
 * Usage:
 * <span sd-reldate-complex data-useutc="false" ng-model="user._created"></span>
 *
 * Params:
 * @param {object} ngModel - datetime string in utc
 * @param {boolean} useutc - if true vlues are converted to local datetime
 */
ReldateComplex.$inject = ['config', 'gettextCatalog'];
function ReldateComplex(config, gettextCatalog) {
    var COMPARE_FORMAT = config.model.dateformat;
    var DATE_FORMAT = config.view.dateformat || config.model.dateformat;
    var TIME_FORMAT = config.view.timeformat || config.model.timeformat;
    var DISPLAY_DATE_FORMAT = DATE_FORMAT + ' ' + TIME_FORMAT;
    var DISPLAY_DAY_FORMAT = 'dddd ';
    var DISPLAY_TODAY_FORMAT = '[Today]';

    return {
        scope: {
            useutc: '=',
            ngModel: '='
        },
        require: 'ngModel',
        template: '<time datetime="{{ datetime }}">' +
            '<span>{{rday}}, &nbsp;{{ rdate }}</span></time>',
        link: function(scope, element, attrs, ngModel) {
            var useutc = angular.isUndefined(scope.useutc) ? true : !!scope.useutc;

            ngModel.$render = function() {
                var date = moment.utc(ngModel.$viewValue);

                scope.datetime = date.toISOString();

                if (useutc) {
                    date.local(); // switch to local time zone
                }

                if (moment().format(COMPARE_FORMAT) === date.format(COMPARE_FORMAT)) {
                    scope.rday = gettextCatalog.getString(date.format(DISPLAY_TODAY_FORMAT));
                } else {
                    scope.rday = date.format(DISPLAY_DAY_FORMAT);
                }

                scope.rdate = date.format(DISPLAY_DATE_FORMAT);
            };
        }
    };
}

angular.module('superdesk.core.datetime.reldatecomplex', []).directive('sdReldateComplex', ReldateComplex);
