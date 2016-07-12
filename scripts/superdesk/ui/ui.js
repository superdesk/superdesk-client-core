(function() {
    'use strict';

    /**
     * Gives toggle functionality to the box
     *
     * Usage:
     * <div sd-toggle-box data-title="Some title" data-open="true" data-icon="list"></div>
     *
     */
    function ToggleBoxDirective() {
        return {
            templateUrl: 'scripts/superdesk/ui/views/toggle-box.html',
            transclude: true,
            scope: true,
            link: function($scope, element, attrs) {
                $scope.title = attrs.title;
                $scope.isOpen = attrs.open === 'true';
                $scope.icon = attrs.icon;
                $scope.mode = attrs.mode;
                $scope.style = attrs.style;
                $scope.toggleModule = function() {
                    $scope.isOpen = !$scope.isOpen;
                };
            }
        };
    }

    /**
     * Gives top shadow for scroll elements
     *
     * Usage:
     * <div sd-shadow></div>
     */
    ShadowDirective.$inject = ['$timeout'];
    function ShadowDirective($timeout) {
        return {
            link: function(scope, element, attrs) {

                element.addClass('shadow-list-holder');

                function shadowTimeout() {
                    var shadow = angular.element('<div class="scroll-shadow"><div class="inner"></div></div>');
                    element.parent().prepend(shadow);
                    element.on('scroll', function scroll() {
                        if ($(this).scrollTop() > 0) {
                            shadow.addClass('shadow');
                        } else {
                            shadow.removeClass('shadow');
                        }
                    });
                }

                scope.$on('$destroy', function() {
                    element.off('scroll');
                });

                $timeout(shadowTimeout, 1, false);
            }
        };
    }

    /**
     * Convert newline charachter from text into given html element (default <br/>)
     *
     * Usage:
     * <div data-html="text | nl2el"></div>
     * or
     * <div data-html="text | nl2el:'</p><p>'"></div> for specific replace element
     */
    function NewlineToElement() {
        return function(input, el) {
            return input.replace(/(?:\r\n|\r|\n)/g, el || '<br/>');
        };
    }

    /**
     * Handle all wizards used in UI
     *
     */
    WizardHandlerFactory.$inject = [];
    function WizardHandlerFactory() {

        var service = {};
        var wizards = {};

        service.defaultName = 'defaultWizard';

        service.addWizard = function(name, wizard) {
            wizards[name] = wizard;
        };

        service.removeWizard = function(name) {
            delete wizards[name];
        };

        service.wizard = function(name) {
            var nameToUse = name || service.defaultName;
            return wizards[nameToUse];
        };

        return service;
    }

    WizardDirective.$inject = [];
    function WizardDirective() {
        return {
            templateUrl: 'scripts/superdesk/ui/views/wizard.html',
            scope: {
                currentStep: '=',
                finish: '&',
                name: '@'
            },
            transclude: true,
            controller: ['$scope', '$element', 'WizardHandler', function($scope, element, WizardHandler) {

                WizardHandler.addWizard($scope.name || WizardHandler.defaultName, this);
                $scope.$on('$destroy', function() {
                    WizardHandler.removeWizard($scope.name || WizardHandler.defaultName);
                });

                $scope.selectedStep = null;
                $scope.steps = [];

                var stopWatch;
                this.addStep = function(step) {
                    $scope.steps.push(step);

                    if (!stopWatch) {
                        stopWatch = $scope.$watch('currentStep', function(stepCode) {
                            if (stepCode && (($scope.selectedStep && $scope.selectedStep.code !== stepCode) || !$scope.selectedStep)) {
                                $scope.goTo(_.findWhere($scope.steps, {code: stepCode}));
                            }
                        });
                    }
                };

                function unselectAll() {
                    _.each($scope.steps, function (step) {
                        step.selected = false;
                    });
                    $scope.selectedStep = null;
                }

                $scope.goTo = function(step) {
                    unselectAll();
                    $scope.selectedStep = step;
                    if (!_.isUndefined($scope.currentStep)) {
                        $scope.currentStep = step.code;
                    }
                    step.selected = true;
                };

                this.goTo = function(step) {
                    var stepTo;
                    if (_.isNumber(step)) {
                        stepTo = $scope.steps[step];
                    } else {
                        stepTo = _.findWhere($scope.steps, {code: step});
                    }
                    $scope.goTo(stepTo);
                };

                this.next = function() {
                    var index = _.indexOf($scope.steps , $scope.selectedStep);
                    if (index === $scope.steps.length - 1) {
                        this.finish();
                    } else {
                        $scope.goTo($scope.steps[index + 1]);
                    }
                };

                this.previous = function() {
                    var index = _.indexOf($scope.steps , $scope.selectedStep);
                    $scope.goTo($scope.steps[index - 1]);
                };

                this.finish = function() {
                    if ($scope.finish) {
                        $scope.finish();
                    }
                };
            }]
        };
    }

    WizardStepDirective.$inject = [];
    function WizardStepDirective() {
        return {
            templateUrl: 'scripts/superdesk/ui/views/wizardStep.html',
            scope: {
                title: '@',
                code: '@',
                disabled: '='
            },
            transclude: true,
            require: '^sdWizard',
            link: function($scope, element, attrs, wizard) {
                wizard.addStep($scope);
            }
        };
    }

    CreateButtonDirective.$inject = [];
    function CreateButtonDirective() {
        return {
            restrict: 'C',
            template: '<i class="svg-icon-plus"></i><span class="circle"></span>'
        };
    }

    AutofocusDirective.$inject = [];
    function AutofocusDirective() {
        return {
            link: function(scope, element) {
                _.defer (function() {
                    var value = element.val();
                    element.val('').focus();
                    element.val(value);
                });
            }
        };
    }

    AutoexpandDirective.$inject = [];
    function AutoexpandDirective() {
        return {
            link: function(scope, element) {

                var _minHeight = element.outerHeight();

                function resize() {
                    var e = element[0];
                    var vlen = e.value.length;
                    if (vlen !== e.valLength) {
                        if (vlen < e.valLength) {
                            e.style.height = '0px';
                        }
                        var h = Math.max(_minHeight, e.scrollHeight);

                        e.style.overflow = (e.scrollHeight > h ? 'auto' : 'hidden');
                        e.style.height = h + 1 + 'px';

                        e.valLength = vlen;
                    }
                }

                resize();

                element.on('keyup change', function() {
                    resize();
                });

            }
        };
    }

    DropdownPositionDirective.$inject = ['$document'];
    function DropdownPositionDirective($document) {
        return {
            link: function(scope, element) {

                var tolerance = 300,
                    isRightOriented = null,
                    isInlineOriented = null,
                    menu = null;

                element.bind('click', function(event) {

                    if (menu === null) {
                        checkOrientation();
                    }

                    if (closeToBottom(event)) {
                        element.addClass('dropup');
                    } else {
                        element.removeClass('dropup');
                    }

                    if (isRightOriented) {
                        if (closeToLeft(event)) {
                            menu.removeClass('pull-right');
                        } else {
                            menu.addClass('pull-right');
                        }

                        if (closeToRight(event)) {
                            menu.addClass('pull-right');
                        } else {
                            menu.removeClass('pull-right');
                        }
                    }

                    if (isInlineOriented) {
                        if (closeToLeft(event)) {
                            element.removeClass('dropleft').addClass('dropright');
                        } else {
                            element.addClass('dropleft').removeClass('dropright');
                        }

                        if (closeToRight(event)) {
                            element.removeClass('dropright').addClass('dropleft');
                        } else {
                            element.addClass('dropright').removeClass('dropleft');
                        }
                    }
                });

                function checkOrientation() {
                    menu = element.children('.dropdown-menu');
                    isRightOriented = menu.hasClass('pull-right');
                    isInlineOriented = element.hasClass('dropright') || element.hasClass('dropleft');
                }

                function closeToBottom(e) {
                    var docHeight = $document.height();
                    return e.pageY > docHeight - tolerance;
                }

                function closeToLeft(e) {
                    return e.pageX < tolerance;
                }

                function closeToRight(e) {
                    var docWidth = $document.width();
                    return (docWidth - e.pageX) < tolerance;
                }
            }
        };
    }

    DropdownPositionRightDirective.$inject = ['$position'];
    /**
     * Correct dropdown menu position to be right aligned
     * with dots-vertical icon.
     */
    function DropdownPositionRightDirective($position) {
        return {
            require: 'dropdown',
            link: function(scope, elem, attrs, dropdown) {
                var icon = elem.find('[class*="icon-"]');
                // ported from bootstrap 0.13.1
                scope.$watch(dropdown.isOpen, function(isOpen) {
                    if (isOpen) {
                        var pos = $position.positionElements(icon, dropdown.dropdownMenu, 'bottom-right', true),
                            windowHeight = window.innerHeight - 30; // Substracting 30 is for submenu bar

                        var css = {
                            top: pos.top + 'px',
                            display: isOpen ? 'block' : 'none',
                            opacity: '1',
                            left: 'auto',
                            right: Math.max(5, window.innerWidth - pos.left)
                        };

                        scope.$evalAsync(function () {
                            // Hide it to avoid flickering
                            dropdown.dropdownMenu.css({opacity: '0', left: 'auto'});
                        });

                        scope.$applyAsync(function () {
                            /*
                             * Calculate if there is enough space for showing after the icon
                             * if not, show it above the icon
                             */
                            var dropdownHeight = dropdown.dropdownMenu.outerHeight(),
                                    dropdownWidth = dropdown.dropdownMenu.outerWidth();

                            if ((windowHeight - pos.top) < dropdownHeight) {
                                if ((pos.top - 150) < dropdownHeight) {
                                    // Substracting 150 is for topmenu and submenu bar
                                    css.top = '150px';
                                    css.right = css.right + 30;
                                } else {
                                    css.top = pos.top - dropdownHeight - icon.outerHeight() - 15;
                                    // Subtracting 15 so the dropdown is not stick to the icon
                                }
                            }

                            /*
                             * Calculate if there is enough space for opening on left side of icon,
                             * if not, move it to the right side
                             */
                            if ((pos.left - 48) < dropdownWidth) {
                                css.right -= dropdownWidth;
                            }
                            dropdown.dropdownMenu.css(css);
                        });
                    }
                });
            }
        };
    }

    DropdownFocus.$inject = ['Keys'];
    function DropdownFocus(Keys) {
        return {
            require: 'dropdown',
            link: function (scope, elem, attrs, dropdown) {
                scope.$watch(dropdown.isOpen, function(isOpen) {
                    var inputField = elem.find('input[type="text"]');

                    if (isOpen) {
                        _.defer(function() {
                            var buttonList = elem.find('button:not([disabled]):not(.dropdown-toggle)');
                            var handlers = {};

                            /**
                             * If input field exist, put focus on it,
                             * otherwise put it on first button in list
                             */
                            if (inputField.length > 0) {
                                inputField.focus();
                            } else if (buttonList.length) {
                                buttonList[0].focus();
                            }

                            elem.tabindex = ''; // make parent element receive keyboard events
                            elem.on('keydown', function(event) {
                                if (handlers[event.keyCode] && !event.ctrlKey && !event.metaKey) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handlers[event.keyCode]();
                                }
                            });

                            inputField.on('keyup', function(event) {
                                var mainList = elem.find('.main-list').children('ul').find('li > button')[0];
                                if (event.keyCode === Keys.down && mainList) {
                                    mainList.focus();
                                }
                            });

                            handlers[Keys.up] = function handleUp() {
                                var prevElem = elem.find('button:focus').parent('li').prev().children('button'),
                                    categoryButton = elem.find('.levelup button');

                                if (prevElem.length > 0) {
                                    prevElem.focus();
                                } else {
                                    inputField.focus();
                                    categoryButton.focus();
                                }
                            };

                            handlers[Keys.down] = function handleDown() {
                                var nextElem = elem.find('button:focus').parent('li').next().children('button'),
                                    categoryButton = elem.find('.levelup button');

                                /*
                                 * If category button exist, update button list with new values,
                                 * but exclude category button
                                 */
                                if (categoryButton.length > 0) {
                                    var newList = elem.find('button:not([disabled]):not(.dropdown-toggle)');
                                    buttonList = _.without(newList, categoryButton[0]);
                                }

                                if (inputField.is(':focus') || categoryButton.is(':focus')) {
                                    if (_.isEmpty(inputField.val())) {
                                        var mainList = elem.find('.main-list').children('ul').find('li > button');
                                        if (mainList[0] !== undefined) {
                                            mainList[0].focus();
                                        }
                                    } else {
                                        var buttonSet = elem.find('button:not([disabled]):not(.dropdown-toggle)');
                                        if (buttonSet[0] !== undefined) {
                                            buttonSet[0].focus();
                                        }
                                    }
                                } else if (nextElem.length > 0) {
                                    nextElem.focus();
                                } else {
                                    if (buttonList[0] !== undefined) {
                                        buttonList[0].focus();
                                    }
                                }
                            };

                            handlers[Keys.left] = function handleLeft() {
                                elem.find('.backlink').click();
                            };

                            handlers[Keys.right] = function handleRight() {
                                var selectedElem = elem.find('button:focus').parent('li');
                                selectedElem.find('.nested-toggle').click();
                            };
                        });
                    } else if (isOpen === false) { // Exclusively false, prevent executing if it is undefined
                        elem.off('keydown');
                        inputField.off('keyup');
                    }
                });
            }
        };
    }

    PopupService.$inject = ['$document'];
    function PopupService($document) {
        var service = {};

        service.position = function(width, height, target) {
            //taking care of screen size and responsiveness
            var tolerance = 10;
            var elOffset = target.offset();
            var elHeight = target.outerHeight();
            var docHeight = $document.height();
            var docWidth = $document.width();

            var position = {top: 0, left:0};

            if ((elOffset.top + elHeight + height + tolerance) > docHeight) {
                position.top = elOffset.top - height;
            } else {
                position.top = elOffset.top + elHeight;
            }

            if ((elOffset.left + width + tolerance) > docWidth) {
                position.left = docWidth - tolerance - width;
            } else {
                position.left = elOffset.left;
            }
            return position;
        };

        return service;
    }

    function DatepickerWrapper() {
        return {
            transclude: true,
            templateUrl: 'scripts/superdesk/ui/views/datepicker-wrapper.html',
            link: function (scope, element) {
                element.bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
            }
        };
    }

    /**
     * Datepicker directive
     *
     * Usage:
     * <div sd-datepicker ng-model="date"></div>
     *
     */
    DatepickerDirective.$inject = ['$document'];
    function DatepickerDirective($document) {
        return {
            scope: {
                dt: '=ngModel',
                disabled: '=ngDisabled'
            },
            templateUrl: 'scripts/superdesk/ui/views/sd-datepicker.html',
            link: function(scope, element) {
                scope.state = {opened: false};
                scope.openCalendar = function(e) {
                    scope.state.opened = !scope.state.opened;

                    $document.on('click', handleDatePicker);
                };

                function close() {
                    scope.state.opened = false;
                    $document.off('click', handleDatePicker);
                }

                function handleDatePicker(event) {
                    var isChild = element.find(event.target).length > 0;
                    if (scope.state.opened && !isChild) {  // outside Datepicker click
                        scope.$apply(function() {
                            close();
                        });
                    }
                }

                scope.$on('$destroy', function() {
                    $document.off('click', handleDatePicker);
                });
            }
        };
    }

    DatepickerInnerDirective.$inject = ['$compile', '$document', 'popupService', 'datetimeHelper', 'config'];
    function DatepickerInnerDirective($compile, $document, popupService, datetimeHelper, config) {
        var starting_day = config.startingDay || '0';
        var popupTpl =
        '<div sd-datepicker-wrapper ng-model="date">' +
            '<div datepicker format-day="d" starting-day="' + starting_day + '" show-weeks="false"></div>' +
        '</div>';

        return {
            require: 'ngModel',
            scope: {
                open: '=opened'
            },
            link: function (scope, element, attrs, ctrl) {

                var VIEW_DATE_FORMAT = config.view.dateformat;
                var MODEL_DATE_FORMAT = config.model.dateformat;
                var ESC = 27;
                var DOWN_ARROW = 40;
                var popup = angular.element(popupTpl);

                ctrl.$parsers.unshift(function parseDate(viewValue) {
                    if (!viewValue) {
                        ctrl.$setValidity('date', true);
                        return null;
                    } else if (viewValue.dpdate) {
                        //from datepicker
                        ctrl.$setValidity('date', true);
                        return moment(viewValue.dpdate).format(MODEL_DATE_FORMAT);
                    } else if (datetimeHelper.isValidDate(viewValue, VIEW_DATE_FORMAT)) {
                        //date was typed in
                        ctrl.$setValidity('date', true);
                        return moment(viewValue, VIEW_DATE_FORMAT).format(MODEL_DATE_FORMAT);
                    } else {
                        //input is not valid
                        ctrl.$setValidity('date', false);
                        return null;
                    }
                });

                scope.dateSelection = function(dt) {
                    if (angular.isDefined(dt)) {
                        //if one of predefined dates is selected (today, tomorrow...)
                        scope.date = dt;
                    }
                    ctrl.$setViewValue({
                        dpdate: scope.date,
                        viewdate: moment(scope.date).format(VIEW_DATE_FORMAT)
                    });
                    ctrl.$render();
                    scope.close();
                };

                //select one of predefined dates
                scope.select = function(offset) {
                    var day = moment().startOf('day').add(offset, 'days');
                    scope.dateSelection(day);
                };

                ctrl.$render = function() {
                    element.val(ctrl.$viewValue.viewdate);  //set the view
                    scope.date = ctrl.$viewValue.dpdate;    //set datepicker model
                };

                //handle model changes
                ctrl.$formatters.unshift(function dateFormatter(modelValue) {
                    var dpdate,
                        viewdate = 'Invalid Date';

                    if (modelValue) {
                        if (datetimeHelper.isValidDate(modelValue, MODEL_DATE_FORMAT)) {
                            dpdate = moment(modelValue, MODEL_DATE_FORMAT).toDate();
                            viewdate = moment(modelValue, MODEL_DATE_FORMAT).format(VIEW_DATE_FORMAT);
                        }
                    } else {
                        viewdate = '';
                    }

                    return {
                        dpdate: dpdate,
                        viewdate: viewdate
                    };
                });

                scope.$watch('open', function(value) {
                    if (value) {
                        $popupWrapper.offset(popupService.position(260, 270, element));
                        scope.$broadcast('datepicker.focus');
                    }
                });

                scope.keydown = function(evt) {
                    if (evt.which === ESC) {
                        evt.preventDefault();
                        scope.close();
                    } else if (evt.which === DOWN_ARROW && !scope.open) {
                        scope.$apply(function () {
                            scope.open = true;
                        });
                    }
                };

                element.bind('keydown', scope.keydown);

                scope.close = function() {
                    scope.open = false;
                    element[0].focus();
                };

                var $popupWrapper = $compile(popup)(scope);
                popup.remove();
                $document.find('body').append($popupWrapper);

                scope.$on('$destroy', function() {
                    $popupWrapper.remove();
                    element.unbind('keydown', scope.keydown);
                });
            }
        };
    }

    TimepickerDirective.$inject = ['$document'];
    function TimepickerDirective($document) {
        return {
            scope: {
                tt: '=ngModel',
                style: '@',
                disabled: '=ngDisabled'
            },
            templateUrl: 'scripts/superdesk/ui/views/sd-timepicker.html',
            link: function (scope, element) {

                scope.openTimePicker = function(e) {
                    scope.opened = !scope.opened;

                    $document.on('click', handleTimePicker);
                };

                function close() {
                    scope.opened = false;
                    $document.off('click', handleTimePicker);
                }

                function handleTimePicker(event) {
                    var isChild = element.find(event.target).length > 0;
                    if (scope.opened && !isChild) {  // outside Timepicker click
                        scope.$apply(function() {
                            close();
                        });
                    }
                }

                scope.$on('$destroy', function() {
                    $document.off('click', handleTimePicker);
                });
            }
        };
    }

    TimepickerInnerDirective.$inject = ['$compile', '$document', 'popupService', 'datetimeHelper', 'config'];
    function TimepickerInnerDirective($compile, $document, popupService, datetimeHelper, config) {
        var popupTpl = '<div sd-timepicker-popup ' +
            'data-open="open" data-time="time" data-select="timeSelection({time: time})" data-keydown="keydown(e)">' +
            '</div>';
        return {
            scope: {
                open: '=opened'
            },
            require: 'ngModel',
            link: function(scope, element, attrs, ctrl) {

                var MODEL_TIME_FORMAT = config.model.timeformat;
                var VIEW_TIME_FORMAT = config.view.timeformat || MODEL_TIME_FORMAT;
                var ESC = 27;
                var DOWN_ARROW = 40;
                var popup = angular.element(popupTpl);

                function viewFormat(modelTime) {
                    return moment(modelTime, MODEL_TIME_FORMAT).format(VIEW_TIME_FORMAT);
                }

                ctrl.$parsers.unshift(function parseDate(viewValue) {
                    if (!viewValue) {
                        ctrl.$setValidity('time', true);
                        return null;
                    } else if (viewValue.tptime) {
                        //time selected from picker
                        ctrl.$setValidity('time', true);
                        return viewValue.tptime;
                    } else if (datetimeHelper.isValidTime(viewValue, VIEW_TIME_FORMAT)) {
                        //time written in
                        ctrl.$setValidity('time', true);
                        scope.time = moment(viewValue, VIEW_TIME_FORMAT).format(MODEL_TIME_FORMAT);
                        return scope.time;
                    } else {
                        //regex not passing
                        ctrl.$setValidity('time', false);
                        return null;
                    }
                });

                scope.timeSelection = function(tt) {
                    if (angular.isDefined(tt)) {
                        //if one of predefined time options is selected
                        scope.time = tt.time;
                        ctrl.$setViewValue({tptime: tt.time, viewtime: viewFormat(tt.time)});
                        ctrl.$render();
                    }
                    scope.close();
                };

                ctrl.$render = function() {
                    element.val(ctrl.$viewValue.viewtime);  //set the view
                    scope.time = ctrl.$viewValue.tptime;    //set timepicker model
                };

                //handle model changes
                ctrl.$formatters.unshift(function dateFormatter(modelValue) {
                    var tptime,
                        viewtime = 'Invalid Time';

                    if (modelValue) {
                        if (datetimeHelper.isValidTime(modelValue, MODEL_TIME_FORMAT)) {
                            //formatter pass fine
                            tptime = modelValue;
                            viewtime =  viewFormat(modelValue);
                        }
                    } else {
                        viewtime = '';
                    }

                    return {
                        tptime: tptime,
                        viewtime: viewtime
                    };
                });

                scope.$watch('open', function(value) {
                    if (value) {
                        $popupWrapper.offset(popupService.position(200, 310, element));
                        scope.$broadcast('timepicker.focus');
                    }
                });

                scope.keydown = function(evt) {
                    if (evt.which === ESC) {
                        evt.preventDefault();
                        scope.close();
                    } else if (evt.which === DOWN_ARROW && !scope.open) {
                        scope.$apply(function () {
                            scope.open = true;
                        });
                    }
                };

                element.bind('keydown', scope.keydown);

                scope.close = function() {
                    scope.open = false;
                    element[0].focus();
                };

                var $popupWrapper = $compile(popup)(scope);
                popup.remove();
                $document.find('body').append($popupWrapper);

                scope.$on('$destroy', function() {
                    $popupWrapper.remove();
                    element.unbind('keydown', scope.keydown);
                });
            }
        };
    }

    TimezoneDirective.$inject = ['tzdata', 'config', '$timeout'];
    function TimezoneDirective(tzdata, config, $timeout) {
        return {
            templateUrl: 'scripts/superdesk/ui/views/sd-timezone.html',
            scope: {
                timezone: '=',
                style: '@'
            },
            link: function(scope, el) {
                scope.timeZones = [];     // all time zones to choose from
                scope.tzSearchTerm = '';  // the current time zone search term

                // filtered time zone list containing only those that match
                // user-provided search term
                scope.matchingTimeZones = [];

                tzdata.$promise.then(function () {
                    scope.timeZones = tzdata.getTzNames();
                    if (!scope.timezone && config.defaultTimezone) {
                        scope.selectTimeZone(config.defaultTimezone);
                    }
                });

                /**
                 * Sets the list of time zones to select from to only those
                 * that contain the given search term (case-insensitive).
                 * If the search term is empty, it results in an empty list.
                 *
                 * @method searchTimeZones
                 * @param {string} searchTerm
                 */
                scope.searchTimeZones = function (searchTerm) {
                    var termLower;

                    scope.tzSearchTerm = searchTerm;

                    if (!searchTerm) {
                        scope.matchingTimeZones = [];
                        return;
                    }

                    termLower = searchTerm.toLowerCase();
                    scope.matchingTimeZones = _.filter(
                        scope.timeZones,
                        function (item) {
                            return (item.toLowerCase().indexOf(termLower) >= 0);
                        }
                    );
                };

                /**
                 * Sets the time zone of the routing rule's schedule and resets
                 * the current time zone search term.
                 *
                 * @method selectTimeZone
                 * @param {string} tz - name of the time zone to select
                 */
                scope.selectTimeZone = function (tz) {
                    scope.timezone = tz;
                    scope.tzSearchTerm = '';
                };

                /**
                 * Clears the currently selected time zone of the routing
                 * rule's schedule.
                 *
                 * @method clearSelectedTimeZone
                 */
                scope.clearSelectedTimeZone = function () {
                    $timeout(function() {
                        el.find('input')[0].focus();
                    }, 0, false);
                    delete scope.timezone;
                };

            }
        };
    }

    TimepickerPopupDirective.$inject = ['$timeout', 'config'];
    function TimepickerPopupDirective($timeout, config) {
        return {
            templateUrl: 'scripts/superdesk/ui/views/sd-timepicker-popup.html',
            scope: {
                open: '=',
                select: '&',
                keydown: '&',
                time: '='
            },
            link: function(scope, element) {

                var MODEL_TIME_FORMAT = config.model.timeformat;

                var POPUP = '.timepicker-popup';

                var focusElement = function() {
                    $timeout(function() {
                        element.find(POPUP).focus();
                    }, 0 , false);
                };

                scope.$on('timepicker.focus', focusElement);

                element.bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                });

                scope.hours = _.range(24);
                scope.minutes = _.range(0, 60, 5);

                scope.$watch('time', function(newVal, oldVal) {
                    var local;
                    if (newVal) {
                        local = moment(newVal, MODEL_TIME_FORMAT);
                    } else {
                        local = moment();
                        local.add(5 - local.minute() % 5, 'm'); // and some time up to 5m
                    }

                    scope.hour = local.hour();
                    scope.minute = local.minute();
                    scope.second = 0;
                });

                scope.submit = function(offset) {
                    var local, time;
                    if (offset) {
                        local = moment().add(offset, 'minutes').format(MODEL_TIME_FORMAT);
                    } else {
                        local = scope.hour + ':' + scope.minute + ':' + scope.second;
                    }
                    //convert from local to utc
                    time = moment(local, MODEL_TIME_FORMAT).format(MODEL_TIME_FORMAT);
                    scope.select({time: time});
                };

                scope.cancel =  function() {
                    scope.select();
                };
            }
        };
    }

    function LeadingZeroFilter() {
        return function(input) {
            if (input < 10) {
                input = '0' + input;
            }
            return input;
        };
    }

    WeekdayPickerDirective.$inject = ['weekdays'];
    function WeekdayPickerDirective(weekdays) {
        return {
            templateUrl: 'scripts/superdesk/ui/views/weekday-picker.html',
            scope: {model: '='},
            link: function(scope) {
                scope.weekdays = weekdays;
                scope.weekdayList = Object.keys(weekdays);

                scope.model = scope.model || [];

                /**
                 * Test if given day is selected for schedule
                 *
                 * @param {string} day
                 * @return {boolean}
                 */
                scope.isDayChecked = function(day) {
                    return scope.model.indexOf(day) !== -1;
                };

                /**
                 * Toggle given day on/off
                 *
                 * @param {string} day
                 */
                scope.toggleDay = function(day) {
                    if (scope.isDayChecked(day)) {
                        scope.model.splice(scope.model.indexOf(day), 1);
                    } else {
                        scope.model.push(day);
                    }
                };
            }
        };
    }

    /*
     * Splitter widget, allows user to dinamicaly
     * resize monitoring and authoring screen
     *
     */
    splitterWidget.$inject = ['superdesk', 'superdeskFlags', '$timeout'];
    function splitterWidget(superdesk, superdeskFlags, $timeout) {
        return {
            link: function(scope, element) {
                var workspace = element,
                    authoring = element.next('#authoring-container');

                /*
                 * If custom sizes are defined, preload them
                 */
                if (superdesk.monitoringWidth && superdesk.authoringWidth) {
                    workspace.css({width: superdesk.monitoringWidth});
                    authoring.css({width: superdesk.authoringWidth});
                }

                /*
                 * If authoring is not initialized,
                 * wait, and initialize it again
                 *
                 * This issue is observed when you are
                 * switching from settings back to monitoring
                 */
                if (!authoring.length) {
                    $timeout(function () {
                        authoring = element.next('#authoring-container');
                        authoring.width(superdesk.authoringWidth);
                    }, 0, false);
                }

                workspace.resizable({
                    handles: 'e',
                    minWidth: 400,
                    start: function(e, ui) {
                        var container = ui.element.parent();
                        workspace.resizable({maxWidth: container.width() - 730});
                    },
                    resize: function (e, ui) {
                        var container = ui.element.parent(),
                            remainingSpace = container.width() - workspace.outerWidth() - 48,
                            authoringWidth = remainingSpace - (authoring.outerWidth() - authoring.width());

                        if (workspace.outerWidth() < 655) {
                            workspace.addClass('ui-responsive-medium');
                        } else {
                            workspace.removeClass('ui-responsive-medium');
                        }

                        if (workspace.outerWidth() < 460) {
                            workspace.addClass('ui-responsive-small');
                        } else {
                            workspace.removeClass('ui-responsive-small');
                        }

                        authoring.width(authoringWidth / container.width() * 100 + '%');
                    },
                    stop: function (e, ui) {
                        var container = ui.element.parent();

                        superdesk.monitoringWidth = workspace.outerWidth() / container.width() * 100 + '%';
                        superdesk.authoringWidth = authoring.outerWidth() / container.width() * 100 + '%';

                        ui.element.css({
                            width: superdesk.monitoringWidth
                        });
                    }
                });
            }
        };
    }

    /*
     * Media Query directive is used for creating responsive
     * layout's for single elements on page
     *
     * Usage:
     * <div sd-media-query min-width='650' max-width='1440'></div>
     *
     */
    mediaQuery.$inject = ['$window'];
    function mediaQuery($window) {
        return {
            scope: {
                minWidth: '=',
                maxWidth: '='
            },
            link: function (scope, elem) {
                var window = angular.element($window);
                var resize = _.debounce(calcSize, 300);
                window.on('resize', resize);

                function calcSize() {
                    var width = elem.width();
                    if (width < scope.minWidth) {
                        scope.$parent.$applyAsync(function () {
                            scope.$parent.elementState = 'compact';
                        });
                        elem.removeClass('comfort').addClass('compact');
                    } else if (width > scope.maxWidth) {
                        scope.$parent.$applyAsync(function () {
                            scope.$parent.elementState = 'comfort';
                        });
                        elem.removeClass('compact').addClass('comfort');
                    } else {
                        scope.$parent.$applyAsync(function () {
                            scope.$parent.elementState = null;
                        });
                        elem.removeClass('compact comfort');
                    }
                }

                // init
                resize();

                scope.$on('$destroy', function() {
                    window.off('resize', resize);
                });
            }
        };
    }

    /*
     * Focus directive is used for adding class
     * to closest elementon focus and removing it on blur
     *
     * Usage:
     * <div sd-focus-element data-element='input' data-append-element='.field' data-append-class='active'></div>
     *
     */
    focusElement.$inject = [];
    function focusElement() {
        return {
            link: function (scope, elem) {
                var dataElement = elem.attr('data-element'),
                    dataAppendElement = elem.attr('data-append-element'),
                    dataClass = elem.attr('data-append-class'),
                    element = elem;

                if (dataElement) {
                    element = elem.find(dataElement);
                }

                element.on('focus', function () {
                    element.closest(dataAppendElement).addClass(dataClass);
                });

                element.on('blur', function () {
                    element.closest(dataAppendElement).removeClass(dataClass);
                });
            }
        };
    }

    /*
     * Required fields directive
     *
     * Usage:
     * <input type='text' sd-validation-error='error.field' ng-required='schema.field.required' />
     */
    validationDirective.$inject = ['gettext', 'gettextCatalog'];
    function validationDirective(gettext, gettextCatalog) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {
                var invalidText = '<span id="required_span" class="sd-invalid-text">' +
                gettextCatalog.getString('This field is required') + '</span>';
                scope.$watch(attrs.required, function (required) {

                    if (!required) {
                        if (elem.hasClass('sd-validate')) {
                            elem.removeClass('sd-validate');
                        }
                        if (elem.find('#required_span').length) {
                            elem.find('#required_span').remove();
                        }
                        return;
                    }

                    if (elem.find('#required_span').length) {
                        return;
                    }

                    elem.addClass('sd-validate');
                    if (elem.hasClass('field')) {
                        elem.find('label')
                        .after('<span id="required_span" class="sd-required">' + gettextCatalog.getString('Required') + '</span>');
                    } else if (elem.find('.authoring-header__input-holder').length) {
                        elem.find('.authoring-header__input-holder').append(invalidText);
                    } else {
                        elem.append(invalidText);
                    }
                });

                scope.$watch(attrs.sdValidationError, function (isError) {
                    if (isError === true) {
                        elem.addClass('sd-invalid').removeClass('sd-valid');
                    } else if (isError === false) {
                        elem.removeClass('sd-invalid').addClass('sd-valid');
                    }
                });
            }
        };
    }

    /**
     * Loading indicator directive
     *
     * Will fill the closest parent with position absolute/relative,
     * not necessary the element where it's used.
     */
    function LoadingDirective() {
        return {
            transclude: true,
            scope: {loading: '=sdLoading'},
            template: [
                '<div>',
                    '<div ng-transclude></div>',
                    '<div class="loading-overlay" ng-class="{active: loading}"></div>',
                '</div>'
            ].join('')
        };
    }

    return angular.module('superdesk.ui', [
        'superdesk.config',
        'superdesk.datetime',
        'superdesk.ui.autoheight'
    ])

        .config(['defaultConfigProvider', function(defaultConfig) {
            defaultConfig.set('ui.italicAbstract', true);
        }])

        .directive('sdShadow', ShadowDirective)
        .directive('sdToggleBox', ToggleBoxDirective)
        .filter('nl2el', NewlineToElement)
        .factory('WizardHandler', WizardHandlerFactory)
        .directive('sdWizard', WizardDirective)
        .directive('sdWizardStep', WizardStepDirective)
        .directive('sdCreateBtn', CreateButtonDirective)
        .directive('sdAutofocus', AutofocusDirective)
        .directive('sdAutoexpand', AutoexpandDirective)
        .directive('sdTimezone', TimezoneDirective)
        .directive('sdDatepickerInner', DatepickerInnerDirective)
        .directive('sdDatepickerWrapper', DatepickerWrapper)
        .directive('sdDatepicker', DatepickerDirective)
        .directive('sdTimepickerInner', TimepickerInnerDirective)
        .directive('sdTimepickerPopup', TimepickerPopupDirective)
        .directive('sdTimepicker', TimepickerDirective)
        .service('popupService', PopupService)
        .filter('leadingZero', LeadingZeroFilter)
        .directive('sdDropdownPosition', DropdownPositionDirective)
        .directive('sdDropdownPositionRight', DropdownPositionRightDirective)
        .directive('sdDropdownFocus', DropdownFocus)
        .directive('sdWeekdayPicker', WeekdayPickerDirective)
        .directive('sdSplitterWidget', splitterWidget)
        .directive('sdMediaQuery', mediaQuery)
        .directive('sdFocusElement', focusElement)
        .directive('sdValidationError', validationDirective)
        .directive('sdLoading', LoadingDirective)
        ;
})();
