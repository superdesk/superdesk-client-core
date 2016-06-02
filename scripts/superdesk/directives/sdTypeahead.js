(function() {
    'use strict';

    return angular.module('superdesk.typeahead.directives', []).
        /**
         * Typeahead direcitve
         *
         * Usage:
         *  <ul sd-typeahead items="subjects" term="subjectTerm" search="searchSubjects(term)" select="selectSubject(item)">
         *      <li typeahead-item="s" ng-repeat="s in subjects">
         *          {{s.term}}
         *      </li>
         *  </ul>
         *
         * Params:
         * @scope {Object} items - choice list
         * @scope {Object} term - search term
         * @scope {Boolen} alwaysVisible - list of posible choices always stay visible
         * @scope {Function} search - callback for filtering choice action
         * @scope {Function} select - callback for select item aciton
         *
         */
        directive('sdTypeahead', ['$timeout', 'Keys', '$document', function($timeout, Keys, $document) {
            return {
                restrict: 'A',
                transclude: true,
                replace: true,
                templateUrl: 'scripts/superdesk/views/sdTypeahead.html',
                scope: {
                    search: '&',
                    select: '&',
                    items: '=',
                    term: '=',
                    alwaysVisible: '=',
                    disabled: '=',
                    blur: '&',
                    placeholder: '@',
                    tabindex: '='
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
                            $scope.term = null;

                            // triggers closing of dropdown when adding item on search by pressing enter
                            if (item) {
                                $document.triggerHandler('click');
                            }
                        }
                    };

                    $scope.isVisible = function() {
                        return !$scope.hide && ($scope.focused || $scope.mousedOver) && ($scope.items && $scope.items.length > 0);
                    };

                    $scope.query = function() {
                        $scope.hide = false;
                        $scope.search({term: $scope.term});
                    };
                }],

                link: function(scope, element, attrs, controller) {

                    var $input = element.find('.input-term > input');
                    var $list = element.find('.item-list');

                    $input.on('focus', function() {
                        scope.$apply(function() { scope.focused = true; });
                    });

                    $input.on('blur', function() {
                        scope.$apply(function() {
                            scope.focused = false;
                            if (typeof scope.blur === 'function' && !scope.hide) {
                                scope.blur({item: scope.active});
                            }
                        });
                    });

                    $list.on('mouseover', function() {
                        scope.$apply(function() { scope.mousedOver = true; });
                    });

                    $list.on('mouseleave', function() {
                        scope.$apply(function() { scope.mousedOver = false; });
                    });

                    $input.on('keyup', function(e) {
                        if (e.keyCode === Keys.enter) {
                            scope.$apply(function() { controller.selectActive(); });
                        }

                        if (e.keyCode === Keys.escape) {
                            scope.$apply(function() { scope.hide = true; });
                        }
                    });

                    $input.on('keydown', function(e) {
                        if (e.keyCode === Keys.enter || e.keyCode === Keys.escape) {
                            e.preventDefault();
                        }

                        var list = element.find('.item-list')[0];
                        var active = element.find('.active')[0];

                        if (e.keyCode === Keys.down) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (list && list.children.length) {
                                scope.$apply(function() {
                                    controller.activateNextItem();
                                    scrollToActive(list, active);
                                });
                            }
                        }

                        if (e.keyCode === Keys.up) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (list && list.children.length) {
                                scope.$apply(function() {
                                    controller.activatePreviousItem();
                                    scrollToActive(list, active);
                                });
                            }
                        }
                    });

                    scope.$on('$destroy', function() {
                        $input.off();
                        $list.off();
                    });

                    function scrollToActive(list, active) {
                        $timeout(function() {
                            if (list && active) {
                                list.scrollTop = Math.max(0, active.offsetTop - 2 * active.clientHeight);
                            }
                        }, 10, false); // requires a timeout to scroll once the active item gets its class
                    }

                    scope.$watch('focused', function(focused) {
                        if (focused) {
                            $timeout(function() { $input.focus(); }, 0, false);
                        } else {
                            scope.active = null;
                        }
                    });

                    scope.$watch('isVisible()', function(visible) {
                        if (visible || scope.alwaysVisible) {
                            scope.hide = false;
                        } else {
                            scope.active = null;
                        }
                    });
                }
            };
        }])
        .directive('typeaheadItem', function() {
            return {
                require: '^sdTypeahead',
                link: function(scope, element, attrs, controller) {

                    var item = scope.$eval(attrs.typeaheadItem);

                    scope.$watch(function() { return controller.isActive(item); }, function(active) {
                        if (active) {
                            element.addClass('active');
                        } else {
                            element.removeClass('active');
                        }
                    });

                    element.on('mouseenter', function(e) {
                        scope.$apply(function() { controller.activate(item); });
                    });

                    element.on('click', function(e) {
                        scope.$apply(function() { controller.select(item); });
                    });

                    scope.$on('$destroy', function() {
                        element.off();
                    });
                }
            };
        });
})();
