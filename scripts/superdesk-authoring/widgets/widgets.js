(function() {

'use strict';

function AuthoringWidgetsProvider() {

    var widgets = [];

    this.widget = function(id, config) {
        widgets.push(angular.extend({ // make a new instance for every widget
        }, config, {_id: id}));
    };

    this.$get = function() {
        return widgets;
    };
}

WidgetsManagerCtrl.$inject = ['$scope', '$routeParams', 'authoringWidgets', 'archiveService', 'keyboardManager', '$location'];
function WidgetsManagerCtrl($scope, $routeParams, authoringWidgets, archiveService, keyboardManager, $location) {
    $scope.active = null;

    $scope.$watch('item', function(item) {
        if (!item) {
            $scope.widgets = null;
            return;
        }

        var display;

        if (archiveService.isLegal(item)) {
            display = 'legalArchive';
        } else if (archiveService.isArchived(item)) {
            display = 'archived';
        } else {
            display = item.type === 'composite' ? 'packages' : item.state === 'killed' ? 'killedItem' : 'authoring';
        }

        $scope.widgets = authoringWidgets.filter(function(widget) {
            return !!widget.display[display];
        });

        function bindKeyShortcutToWidget(shortcut, widget) {
            keyboardManager.bind(shortcut, function () {
                $scope.activate(widget);
            }, {inputDisabled: false});
        }

        /*
         * Navigate throw right tab widgets with keyboard combination
         * Combination: Ctrl + {{widget number}} and custom keys from `keyboardShortcut` property
         */
        angular.forEach(_.sortBy($scope.widgets, 'order'), function (widget, index) {
            // binding ctrl + {{widget number}}
            bindKeyShortcutToWidget('ctrl+' + (index + 1), widget);
            // binding keys from `widget.keyboardShortcut` property
            if (angular.isDefined(widget.keyboardShortcut)) {
                bindKeyShortcutToWidget(widget.keyboardShortcut, widget);
            }
            if ($location.search()[widget._id]) {
                $scope.activate(widget);
            }
        });
    });

    $scope.isLocked = function(widget) {
        if (widget) {
            return (widget.needUnlock && $scope.item._locked) ||
            (widget.needEditable && !$scope.item._editable);
        }
    };

    $scope.activate = function(widget) {
        if (!$scope.isLocked(widget)) {
            if ($scope.active === widget) {
                $scope.closeWidget();
            } else {
                $scope.active = widget;
            }
        }
    };

    this.activate = function(widget) {
        $scope.activate(widget);
    };

    $scope.closeWidget = function() {
        if ($scope.active && typeof $scope.active.afterClose === 'function') {
            $scope.active.afterClose($scope);
        }
        $scope.active = null;
    };

    // activate widget based on query string
    angular.forEach($scope.widgets, function(widget) {
        if ($routeParams[widget._id]) {
            $scope.activate(widget);
        }
    });

    $scope.$watch('item._locked', function() {
        if ($scope.active) {
            var widget = $scope.active;
            $scope.closeWidget(widget);
            $scope.activate(widget);
        }
    });
}
AuthoringWidgetsDir.$inject = ['desks', 'commentsService'];
function AuthoringWidgetsDir(desks, commentsService) {
    return {
        controller: WidgetsManagerCtrl,
        templateUrl: 'scripts/superdesk-authoring/widgets/views/authoring-widgets.html',
        transclude: true,
        link: function (scope, elem) {
            scope.userLookup = desks.userLookup;
            var editor = elem.find('.page-content-container'),
                stickyHeader = elem.find('.authoring-sticky');

            editor.on('scroll', _.debounce(clipHeader, 100));

            function clipHeader() {
                if (editor.scrollTop() > 5) {
                    stickyHeader.addClass('authoring-sticky--fixed');
                } else {
                    stickyHeader.removeClass('authoring-sticky--fixed');
                }
            }

            function reload() {
                if (scope.item) {
                    commentsService.fetch(scope.item._id).then(function() {
                        scope.comments = commentsService.comments;
                    });
                }
            }

            scope.$on('item:comment', function(e, data) {
                if (data.item === scope.item.guid) {
                    reload();
                }
            });

            reload();
        }
    };
}

angular.module('superdesk.authoring.widgets', ['superdesk.keyboard'])
    .provider('authoringWidgets', AuthoringWidgetsProvider)
    .directive('sdAuthoringWidgets', AuthoringWidgetsDir)
    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Authoring', 'ctrl + #', gettext('Toggles widget #'));
    }]);
})();
