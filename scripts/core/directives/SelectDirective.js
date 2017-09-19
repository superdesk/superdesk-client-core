export default angular.module('superdesk.core.directives.select', ['superdesk.core.services.asset'])
    .factory('optionParser', ['$parse', function($parse) {
        var TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

        return {
            parse: function(input) {
                var match = input.match(TYPEAHEAD_REGEXP);

                if (!match) {
                    throw new Error(
                        'Expected typeahead specification in form of _modelValue_ ' +
                        '(as _label_)? for _item_ in _collection_' +
                      ' but got ' + input + '.'
                    );
                }

                return {
                    itemName: match[3],
                    source: $parse(match[4]),
                    viewMapper: $parse(match[2] || match[1]),
                    modelMapper: $parse(match[1])
                };
            }
        };
    }])

/**
 * @ngdoc directive
 * @module superdesk.core.directives
 * @name sdSelect
 *
 * @requires https://docs.angularjs.org/api/ng/service/$parse $parse
 * @requires https://docs.angularjs.org/api/ng/service/$compile $compile
 * @requires optionParser
 *
 * @description Renders custom input type select with ability to select multiple items.
 *
 * Example:
 * ```html
 * <sd-select multiple="true" ng-model="model" options="c.name for c in collection" change="action()"></sd-multiselect>
 * ```
 */
    .directive('sdSelect', ['$parse', '$compile', 'optionParser',

        function($parse, $compile, optionParser) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(originalScope, element, attrs, modelCtrl) {
                    var exp = attrs.options,
                        parsedResult = optionParser.parse(exp),
                        isMultiple = !!attrs.multiple,
                        required = false,
                        scope = originalScope.$new(),
                        changeHandler = attrs.change || angular.noop;

                    scope.items = [];
                    scope.header = 'Select';
                    scope.multiple = isMultiple;
                    scope.disabled = false;
                    scope.showfilter = !!attrs.showfilter;

                    originalScope.$on('$destroy', () => {
                        scope.$destroy();
                    });

                    var popUpEl = angular.element('<div sd-select-popup></div>');

                    // required validator
                    if (attrs.required || attrs.ngRequired) {
                        required = true;
                    }
                    attrs.$observe('required', (newVal) => {
                        required = newVal;
                    });

                    // watch disabled state
                    scope.$watch(() => $parse(attrs.disabled)(originalScope), (newVal) => {
                        scope.disabled = newVal;
                    });

                    // watch single/multiple state for dynamically change single to multiple
                    scope.$watch(() => $parse(attrs.multiple)(originalScope), (newVal) => {
                        isMultiple = newVal || false;
                    });

                    // watch option changes for options that are populated dynamically
                    scope.$watch(() => parsedResult.source(originalScope), (newVal) => {
                        if (angular.isDefined(newVal)) {
                            parseModel();
                        }
                    }, true);

                    // watch model change
                    scope.$watch(() => modelCtrl.$modelValue, (newVal, oldVal) => {
                    // when directive initialize, newVal usually undefined. Also, if model
                    // value already set in the controller for preselected list then we need
                    // to mark checked in our scope item. But we don't want to do this every
                    // time model changes. We need to do this only if it is done outside
                    // directive scope, from controller, for example.
                        if (angular.isDefined(newVal)) {
                            markChecked(newVal);
                            scope.$eval(changeHandler);
                        }
                        getHeaderText();
                        modelCtrl.$setValidity('required', scope.valid());
                    }, true);

                    function parseModel() {
                        scope.items.length = 0;
                        var model = parsedResult.source(originalScope);

                        if (!angular.isDefined(model)) {
                            return;
                        }
                        for (var i = 0; i < model.length; i++) {
                            var local = {};

                            local[parsedResult.itemName] = model[i];
                            scope.items.push({
                                label: parsedResult.viewMapper(local),
                                model: parsedResult.modelMapper(local),
                                checked: false
                            });
                        }
                    }

                    parseModel();

                    element.append($compile(popUpEl)(scope));

                    function getHeaderText() {
                        if (isEmpty(modelCtrl.$modelValue)) {
                            scope.header = 'Select';
                            return scope.header;
                        }

                        if (isMultiple) {
                            scope.header = modelCtrl.$modelValue.length + ' selected';
                        } else {
                            var local = {};

                            local[parsedResult.itemName] = modelCtrl.$modelValue;
                            scope.header = parsedResult.viewMapper(local);
                        }
                    }

                    function isEmpty(obj) {
                        if (!obj) {
                            return true;
                        }
                        if (obj.length && obj.length > 0) {
                            return false;
                        }
                        for (var prop in obj) {
                            if (obj[prop]) {
                                return false;
                            }
                        }
                        return true;
                    }

                    scope.valid = function validModel() {
                        if (!required) {
                            return true;
                        }
                        var value = modelCtrl.$modelValue;

                        return angular.isArray(value) && value.length > 0 || !angular.isArray(value) && value !== null;
                    };

                    function selectSingle(item) {
                        if (item.checked) {
                            scope.uncheckAll();
                        } else {
                            scope.uncheckAll();
                            item.checked = !item.checked;
                        }
                        setModelValue(false);
                    }

                    function selectMultiple(item) {
                        item.checked = !item.checked;
                        setModelValue(true);
                    }

                    function setModelValue(isMultiple) {
                        var value;

                        if (isMultiple) {
                            value = [];
                            angular.forEach(scope.items, (item) => {
                                if (item.checked) {
                                    value.push(item.model);
                                }
                            });
                        } else {
                            angular.forEach(scope.items, (item) => {
                                if (item.checked) {
                                    value = item.model;
                                    return false;
                                }
                            });
                        }
                        modelCtrl.$setViewValue(value);
                    }

                    function markChecked(newVal) {
                        if (!angular.isArray(newVal)) {
                            angular.forEach(scope.items, (item) => {
                                if (angular.equals(item.model, newVal)) {
                                    item.checked = true;
                                    return false;
                                }
                            });
                        } else {
                            angular.forEach(newVal, (i) => {
                                angular.forEach(scope.items, (item) => {
                                    if (angular.equals(item.model, i)) {
                                        item.checked = true;
                                    }
                                });
                            });
                        }
                    }

                    scope.checkAll = function() {
                        if (!isMultiple) {
                            return;
                        }
                        angular.forEach(scope.items, (item) => {
                            item.checked = true;
                        });
                        setModelValue(true);
                    };

                    scope.uncheckAll = function() {
                        angular.forEach(scope.items, (item) => {
                            item.checked = false;
                        });
                        setModelValue(true);
                    };

                    scope.select = function(item) {
                        if (isMultiple === false) {
                            selectSingle(item);
                            scope.toggleSelect();
                        } else {
                            selectMultiple(item);
                        }
                    };
                }
            };
        }]);
