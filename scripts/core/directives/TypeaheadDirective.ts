export default angular.module('superdesk.core.directives.typeahead', [])
    /**
     * @ngdoc directive
     * @module superdesk.core.directives
     * @name sdTypeahead
     *
     * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
     * @requires Keys
     * @requires https://docs.angularjs.org/api/ng/service/$document $document
     *
     * @param {Object} items Choice list.
     * @param {Object} term Search term.
     * @param {Boolen} alwaysVisible List of posible choices always stay visible.
     * @param {Function} search Callback for filtering choice action.
     * @param {Function} select Callback for select item aciton.
     * @param {Boolean} keepinput if true, the input text after selecting an item-selection will not be deleted/nulled
     *
     * @description Typeahead directive.
     *
     * Example:
     * ```html
     *  <ul sd-typeahead items="subjects" term="subjectTerm" search="searchSubjects(term)" select="selectSubject(item)">
     *      <li typeahead-item="s" ng-repeat="s in subjects">
     *          {{s.term}}
     *      </li>
     *  </ul>
     * ```
     */
    .directive('sdTypeahead', ['$timeout', 'Keys', '$document', function($timeout, Keys, $document) {
        return {
            restrict: 'A',
            transclude: true,
            replace: true,
            templateUrl: 'scripts/core/views/sdTypeahead.html',
            scope: {
                search: '&',
                select: '&',
                items: '=',
                term: '=',
                alwaysVisible: '=',
                disabled: '=',
                blur: '&',
                placeholder: '@',
                tabindex: '=',
                style: '=',
                keepinput: '=',
            },
            controller: ['$scope', function($scope) {
                $scope.hide = true;

                this.activate = function(item) {
                    $scope.active = item;
                };

                this.activateNextItem = function() {
                    var index = $scope.items.indexOf($scope.active);

                    this.activate($scope.items[(index + 1) % $scope.items.length]);
                };

                this.activatePreviousItem = function() {
                    var index = $scope.items.indexOf($scope.active);

                    this.activate($scope.items[index === 0 ? $scope.items.length - 1 : index - 1]);
                };

                this.isActive = function(item) {
                    return $scope.active === item;
                };

                this.selectActive = function() {
                    this.select($scope.active);
                };

                this.select = function(item) {
                    if (!$scope.hide) {
                        $scope.hide = true;
                        $scope.focused = false;
                        $scope.select({item: item});
                        $scope.active = null;

                        // triggers closing of dropdown when adding item on search by pressing enter
                        if (item) {
                            $document.triggerHandler('click');

                            // Clear text input
                            if (!$scope.keepinput) {
                                $scope.term = null;
                            }
                        }
                    }
                };

                $scope.isVisible = function() {
                    return !$scope.hide && ($scope.focused || $scope.mousedOver)
                        && ($scope.items && $scope.items.length > 0);
                };

                $scope.query = function() {
                    $scope.hide = false;
                    $scope.search({term: $scope.term});
                };
            }],

            link: function(scope, element, attrs, controller) {
                var $input = element.find('.input-term > input');
                var $list = element.find('.item-list');

                $input.on('focus', () => {
                    scope.$apply(() => {
                        scope.focused = true;
                    });
                });

                $input.on('blur', () => {
                    scope.$apply(() => {
                        scope.focused = false;
                        if (typeof scope.blur === 'function' && !scope.hide) {
                            scope.blur({item: scope.active});
                        }
                    });
                });

                $list.on('mouseover', () => {
                    scope.$apply(() => {
                        scope.mousedOver = true;
                    });
                });

                $list.on('mouseleave', () => {
                    scope.$apply(() => {
                        scope.mousedOver = false;
                    });
                });

                $input.on('keydown', (e) => {
                    if (e.keyCode === Keys.enter) {
                        scope.$apply(() => {
                            controller.selectActive();
                        });
                        e.preventDefault();
                    }

                    if (e.keyCode === Keys.escape) {
                        scope.$apply(() => {
                            scope.hide = true;
                        });
                    }

                    var list = element.find('.item-list')[0];
                    var active = element.find('.active')[0];

                    if (e.keyCode === Keys.down) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (list && list.children.length) {
                            scope.$apply(() => {
                                controller.activateNextItem();
                                scrollToActive(list, active);
                            });
                        }
                    }

                    if (e.keyCode === Keys.up) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (list && list.children.length) {
                            scope.$apply(() => {
                                controller.activatePreviousItem();
                                scrollToActive(list, active);
                            });
                        }
                    }
                });

                scope.$on('$destroy', () => {
                    $input.off();
                    $list.off();
                });

                function scrollToActive(list, active) {
                    $timeout(() => {
                        if (list && active) {
                            list.scrollTop = Math.max(0, active.offsetTop - 2 * active.clientHeight);
                        }
                    }, 10, false); // requires a timeout to scroll once the active item gets its class
                }

                scope.$watch('focused', (focused) => {
                    if (focused) {
                        $timeout(() => {
                            $input.focus();
                        }, 0, false);
                    } else {
                        scope.active = null;
                    }
                });

                scope.$watch('isVisible()', (visible) => {
                    if (visible || scope.alwaysVisible) {
                        scope.hide = false;
                    } else {
                        scope.active = null;
                    }
                });
            },
        };
    }])
    .directive('typeaheadItem', () => ({
        require: '^sdTypeahead',
        link: function(scope, element, attrs, controller) {
            var item = scope.$eval(attrs.typeaheadItem);

            scope.$watch(() => controller.isActive(item), (active) => {
                if (active) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            });

            element.on('mouseenter', (e) => {
                scope.$apply(() => {
                    controller.activate(item);
                });
            });

            element.on('click', (e) => {
                scope.$apply(() => {
                    controller.select(item);
                });
            });

            scope.$on('$destroy', () => {
                element.off();
            });
        },
    }));
