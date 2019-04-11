import {debounce} from 'lodash';
import {IContentProfile} from 'superdesk-interfaces/ContentProfile';
import {isWidgetVisibleForContentProfile} from 'apps/workspace/content/components/WidgetsConfig';
import {gettext} from 'core/utils';

function AuthoringWidgetsProvider() {
    var widgets = [];

    /**
     * Register new widget
     *
     * @param {String} id
     * @param {Object} config Widget configuration
     *
     *   Object properties:
     *     - `label` - `{string}` - Widget label displayed on top
     *     - `icon` - `{string}` - Icon to use from `big-icon` font.
     *     - `side` - `{string}` - Side where to display it, can be `left` or `right`.
     *     - `order` - `{number}` - Widget order in the list, lower number is higher.
     *     - `template` - `{string}` - Widget template to include.
     *     - `display` - `{Object}` - Controll when to display widget.
     *     - `needEditable` - `{boolean}` - `True` if item must be editable.
     *     - `needUnlock` - `{boolean}` - `True` will make widget locked if item is locked.
     *     - `configurable` - `{boolean}` - `True` if widget is configurable.
     *     - `configurationTemplate` - `{string}` - Template to use for configuration.
     *     - `isWidgetVisible` - `{Function}` = Function which should return injectable
     *       function and gets single param `item`.
     *     - `badge` - `{Function}` - Injectable function to get badge number for item,
     *       gets `item` injected.
     *     - `badgeAsync` - `{Function}` - Injectable function to get badge number
     *       returning a promise, gets `item` injected.
     */
    this.widget = function(id, config) {
        widgets = widgets.filter((widget) => widget._id !== id);
        widgets.push(angular.extend({}, config, {_id: id})); // make a new instance for every widget
    };

    this.$get = function() {
        return widgets;
    };
}

WidgetsManagerCtrl.$inject = ['$scope', '$routeParams', 'authoringWidgets', 'archiveService', 'authoringWorkspace',
    'keyboardManager', '$location', 'desks', 'lock', 'content', 'config', 'lodash', 'privileges', '$injector'];
function WidgetsManagerCtrl($scope, $routeParams, authoringWidgets, archiveService, authoringWorkspace,
    keyboardManager, $location, desks, lock, content, config, _, privileges, $injector) {
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
            display = (item.state === 'killed' || item.state === 'recalled') ? 'killedItem' : 'authoring';
            if (item.type === 'composite') {
                display = 'packages';
            }
            if (item.type === 'picture') {
                display = 'picture';
            }
        }

        const widgets = authoringWidgets.filter((widget) => (
            !!widget.display[display] &&
                // If the widget requires a feature configured, then test this
                // feature name against the config (defaulting to true)
                (!widget.feature || !!_.get(config.features, widget.feature, true))
        ));

        content.getType(item.profile).then((contentProfile: IContentProfile) => {
            const promises = widgets.map(
                (widget) => new Promise((resolve) => {
                    Promise.all([
                        // checking static superdesk config
                        typeof widget.isWidgetVisible === 'function'
                            ? $injector.invoke(widget.isWidgetVisible(item))
                            : Promise.resolve(true),

                        // checking result from plugins
                        authoringWorkspace.isWidgetVisible(widget),

                        Promise.resolve(isWidgetVisibleForContentProfile(contentProfile.widgets_config, widget._id)),
                    ])
                        .then((res) => {
                            resolve(res.every((i) => i === true));
                        })
                        .catch(() => {
                            resolve(false);
                        });
                }),
            );

            Promise.all(promises).then((result) => {
                $scope.widgets = widgets.filter((__, i) => result[i] === true);
                $scope.widgets.forEach((widget) => {
                    if (widget.badgeAsync != null) {
                        widget.badgeAsyncValue = null;
                        $injector.invoke(widget.badgeAsync, null, {item})
                            .then((value) => widget.badgeAsyncValue = value);
                    }
                });
                $scope.$apply(); // tell angular to re-render
            });
        });

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

    // item is associated to an assignment
    $scope.isAssigned = (item) => _.get(item, 'assignment_id') != null
        && _.get(privileges, 'privileges.planning') === 1;

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

            var scrollHandler = debounce(clipHeader, 100);

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
                if (widget.badgeAsyncValue !== undefined) {
                    return widget.badgeAsyncValue;
                }

                if (widget.badge) {
                    return $injector.invoke(widget.badge, null, {item: scope.item});
                }
            };

            scope.generateHotkey = (order, tooltip?) => {
                const shiftNums = {1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '^', 7: '&', 8: '*', 9: '('};

                if (order < 10) {
                    return `ctrl+alt+${order}`;
                } else if (order === 10) {
                    return `ctrl+alt+0`;
                } else if (order > 10) {
                    return tooltip ? `ctrl+shift+${order - 10}` : `ctrl+shift+${shiftNums[order - 10]}`;
                }
            };

            reload();
        },
    };
}

angular.module('superdesk.apps.authoring.widgets', ['superdesk.core.keyboard'])
    .provider('authoringWidgets', AuthoringWidgetsProvider)
    .directive('sdAuthoringWidgets', AuthoringWidgetsDir)
    .run(['keyboardManager', function(keyboardManager) {
        keyboardManager.register('Authoring', 'ctrl + alt + {N}',
            gettext('Toggle Nth widget, where \'N\' is order of widget it appears'));
    }]);
