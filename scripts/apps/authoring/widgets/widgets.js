function AuthoringWidgetsProvider() {
    var widgets = [];

    this.widget = function(id, config) {
        widgets = widgets.filter((widget) => widget._id !== id);
        widgets.push(angular.extend({}, config, {_id: id})); // make a new instance for every widget
    };

    this.$get = function() {
        return widgets;
    };
}

WidgetsManagerCtrl.$inject = ['$scope', '$routeParams', 'authoringWidgets', 'archiveService',
    'keyboardManager', '$location', 'desks', 'lock', 'content'];
function WidgetsManagerCtrl($scope, $routeParams, authoringWidgets, archiveService,
    keyboardManager, $location, desks, lock, content) {
    $scope.active = null;

    $scope.$watch('item', (item) => {
        if (!item) {
            $scope.widgets = null;
            unbindAllShortcuts();
            return;
        }

        var display;

        if (archiveService.isLegal(item)) {
            display = 'legalArchive';
        } else if (archiveService.isArchived(item)) {
            display = 'archived';
        } else if (archiveService.isPersonal(item)) {
            display = 'personal';
        } else {
            display = item.state === 'killed' ? 'killedItem' : 'authoring';
            if (item.type === 'composite') {
                display = 'packages';
            }
            if (item.type === 'picture') {
                display = 'picture';
            }
        }

        let widgets = authoringWidgets.filter((widget) => !!widget.display[display]);

        // if the story has a content profile and if the widget has required fields defined
        // check if the required fields exists in the content profile
        if (item.profile) {
            content.getType(item.profile).then((type) => {
                $scope.widgets = widgets.filter((widget) => {
                    if (widget.requiredFields) {
                        return widget.requiredFields.every((field) => type.schema.hasOwnProperty(field));
                    }
                    return true;
                });
            });
        } else {
            $scope.widgets = widgets;
        }

        bindAllShortcuts();
    });

    var shortcuts = [];

    function unbindAllShortcuts() {
        shortcuts.forEach((sc) => {
            keyboardManager.unbind(sc);
        });
        shortcuts = [];
    }

    function bindKeyShortcutToWidget(shortcut, widget) {
        shortcuts.push(shortcut);
        keyboardManager.bind(shortcut, () => {
            $scope.activate(widget);
        });
    }

    function bindAllShortcuts() {
        /*
         * Navigate through right tab widgets, include custom keys from `keyboardShortcut` property
         */
        angular.forEach(_.sortBy($scope.widgets, 'order'), (widget, index) => {
            // binding keys from `widget.keyboardShortcut` property
            if (angular.isDefined(widget.keyboardShortcut)) {
                bindKeyShortcutToWidget(widget.keyboardShortcut, widget);
            }
            if ($location.search()[widget._id]) {
                $scope.activate(widget);
            }
        });
    }

    $scope.isWidgetLocked = function(widget) {
        if (widget) {
            var locked = lock.isLocked($scope.item) && !lock.can_unlock($scope.item);
            var isReadOnlyStage = desks.isReadOnlyStage($scope.item.task.stage);

            return widget.needUnlock && (locked || isReadOnlyStage) ||
            widget.needEditable && (!$scope.item._editable || isReadOnlyStage);
        }
    };

    $scope.activate = function(widget) {
        if (!$scope.isWidgetLocked(widget)) {
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
    angular.forEach($scope.widgets, (widget) => {
        if ($routeParams[widget._id]) {
            $scope.activate(widget);
        }
    });

    $scope.$watch('item._locked', () => {
        if ($scope.active) {
            var widget = $scope.active;

            $scope.closeWidget(widget);
            $scope.activate(widget);
        }
    });

    $scope.$on('$destroy', () => {
        unbindAllShortcuts();
    });
}
AuthoringWidgetsDir.$inject = ['desks', 'commentsService', '$injector'];
function AuthoringWidgetsDir(desks, commentsService, $injector) {
    return {
        controller: WidgetsManagerCtrl,
        templateUrl: 'scripts/apps/authoring/widgets/views/authoring-widgets.html',
        transclude: true,
        link: function(scope, elem) {
            scope.userLookup = desks.userLookup;
            var editor = elem.find('.page-content-container'),
                stickyHeader = elem.find('.authoring-sticky');

            var scrollHandler = _.debounce(clipHeader, 100);

            editor.on('scroll', scrollHandler);
            scope.$on('$destroy', () => {
                editor.off('scroll', scrollHandler);
            });

            function clipHeader() {
                if (editor.scrollTop() > 5) {
                    stickyHeader.addClass('authoring-sticky--fixed');
                } else {
                    stickyHeader.removeClass('authoring-sticky--fixed');
                }
            }

            function reload() {
                if (scope.item) {
                    commentsService.fetch(scope.item._id).then(() => {
                        scope.comments = commentsService.comments;
                    });
                }
            }

            scope.$on('item:comment', (e, data) => {
                if (data.item === scope.item.guid) {
                    reload();
                }
            });

            scope.badge = (widget) => {
                if (widget.badge) {
                    return $injector.invoke(widget.badge, null, {item: scope.item});
                }
            };

            reload();
        },
    };
}

angular.module('superdesk.apps.authoring.widgets', ['superdesk.core.keyboard'])
    .provider('authoringWidgets', AuthoringWidgetsProvider)
    .directive('sdAuthoringWidgets', AuthoringWidgetsDir)
    .run(['keyboardManager', 'gettext', function(keyboardManager, gettext) {
        keyboardManager.register('Authoring', 'ctrl + alt + {N}',
            gettext('Toggle Nth widget, where \'N\' is order of widget it appears'));
    }]);
