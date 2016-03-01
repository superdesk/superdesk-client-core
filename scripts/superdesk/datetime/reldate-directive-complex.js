(function() {
    'use strict';

    /**
     * Display relative date in <time> element
     *
     * Usage:
     * <span sd-reldate-complex ng-model="user._created"></span>
     *
     * Params:
     * @param {object} ngModel - datetime string in utc
     */
    angular.module('superdesk.datetime.reldatecomplex', []).directive('sdReldateComplex', [ function() {
        var COMPARE_FORMAT = 'YYYY-M-D';
        var DISPLAY_DATE_FORMAT = 'D. MMMM YYYY [at] HH:mm';
        var DISPLAY_CDATE_FORMAT = 'D. MMMM [at] HH:mm';
        var DISPLAY_DAY_FORMAT = 'dddd, ';
        var DISPLAY_TODAY_FORMAT = '[Today], ';
        return {
            scope: {
                useutc: '='
            },
            require: 'ngModel',
            template: '<time datetime="{{ datetime }}">' +
                '<span>{{ rday }}{{ rdate }}</span></time>',
            replate: true,
            link: function(scope, element, attrs, ngModel) {

                if (angular.isUndefined(scope.useutc)) {
                    scope.useutc = true;
                }

                ngModel.$render = function() {
                    var date = moment.utc(ngModel.$viewValue);
                    scope.datetime = date.toISOString();

                    if (scope.useutc) {
                        date.local(); // switch to local time zone
                    }

                    if (moment().format(COMPARE_FORMAT) === date.format(COMPARE_FORMAT)){
                        scope.rday = date.format(DISPLAY_TODAY_FORMAT);
                    } else {
                        scope.rday = date.format(DISPLAY_DAY_FORMAT);
                    }

                    if (moment().format('YYYY') === date.format('YYYY')){
                        scope.rdate = date.format(DISPLAY_CDATE_FORMAT);
                    } else {
                        scope.rdate = date.format(DISPLAY_DATE_FORMAT);
                    }
                };
            }
        };
    }]);
})();
