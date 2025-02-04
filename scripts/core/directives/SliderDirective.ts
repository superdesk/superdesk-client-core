export default angular.module('superdesk.core.directives.slider', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdSlider
     *
     * @param {Object} value Current selected value, if nothing is selected it will use min value
     * @param {Object} list List of options
     * @param {Boolen} disabled Disable or enable slider functionality
     * @param {Object} invert Inverts min and max value
     * @param {Function} update Callback when slider value is changed
     *
     * @description Regular slider.
     */
    .directive('sdSlider', () => ({
        transclude: true,
        templateUrl: 'scripts/core/views/sdSlider.html',
        scope: {
            value: '=',
            list: '=',
            unique: '@',
            field: '@',
            disabled: '=',
            invert: '=',
            update: '&',
        },
        link: function(scope, element, attrs, controller) {
            scope.$watch('list', (list) => {
                if (!list) {
                    return false;
                }

                var value = scope.invert ?
                        -Math.abs(parseInt(scope.value, 10)) :
                        parseInt(scope.value, 10),

                    minValue = scope.invert ?
                        -Math.abs(parseInt(scope.list[scope.list.length - 1][scope.unique], 10)) :
                        parseInt(scope.list[0][scope.unique], 10),

                    maxValue = scope.invert ?
                        -Math.abs(parseInt(scope.list[0][scope.unique], 10)) :
                        parseInt(scope.list[scope.list.length - 1][scope.unique], 10);

                if (!value) {
                    value = minValue;
                }

                $('[sd-slider][data-field="' + scope.field + '"]').slider({
                    range: 'max',
                    min: minValue,
                    max: maxValue,
                    value: value,
                    disabled: scope.disabled,
                    create: function() {
                        $(this).find('.ui-slider-thumb')
                            .css('left', (value - minValue) * 100 / (maxValue - minValue) + '%')
                            .text(scope.invert ? Math.abs(value) : value);
                    },
                    slide: function(event, ui) {
                        $(this).find('.ui-slider-thumb')
                            .css('left', (ui.value - minValue) * 100 / (maxValue - minValue) + '%')
                            .text(scope.invert ? Math.abs(ui.value) : ui.value);

                        scope.update({
                            item: scope.invert ? scope.list[Math.abs(ui.value) - 1] : scope.list[ui.value] - 1,
                            field: scope.field,
                        });
                    },
                    start: function() {
                        $(this).find('.ui-slider-thumb')
                            .addClass('ui-slider-thumb-active');
                    },
                    stop: function() {
                        $(this).find('.ui-slider-thumb')
                            .removeClass('ui-slider-thumb-active');
                    },
                });
            });
        },
    }));
