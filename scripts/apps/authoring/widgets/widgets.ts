import {flatMap, noop} from 'lodash';
import {isWidgetVisibleForContentProfile} from 'apps/workspace/content/components/WidgetsConfig';
import {gettext} from 'core/utils';
import {isKilled} from 'apps/archive/utils';
import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';
import {IArticle, IContentProfile} from 'superdesk-api';
import {appConfig, extensions} from 'appConfig';

const USER_PREFERENCE_SETTINGS = 'editor:pinned_widget';

let PINNED_WIDGET_RESIZED = false;

interface IWidget {
    label?: string;
    icon?: string;
    side?: 'left' | 'right';
    order?: number; // Integer. Lower is higher.
    template?: string;
    display?: {
        archived: boolean;
        authoring: boolean;
        killedItem: boolean;
        legalArchive: boolean;
        packages: boolean;
        personal: boolean;
        picture: boolean;
    };
    needEditable?: boolean; // true if item must be editable.
    needUnlock?: boolean; // true will make widget locked if item is locked.
    configurable?: boolean;
    configurationTemplate?: string;
    isWidgetVisible?: any; // injectable function, gets single param `item`.
    badge?: any; // injectable function to badge number for item.
    badgeAsync: any; // injectable function to badge number for item. Returns a promise.
    removeHeader?: boolean;
    pinned?: boolean;
    _id?: string;
    feature?: string;
    afterClose(): void;
    configuration?: {
        modificationDateAfter: 'today' | string;
        sluglineMatch: 'EXACT' | string;
    };

    // extension-specific fields
    component: React.ComponentType<{article: IArticle}>;
    isAllowed?(article: IArticle): boolean;
}

interface IScope extends ng.IScope {
    item: IArticle;
    active: any;
    widgets: any;
    pinnedWidget: IWidget;
    activate(widget: IWidget): void;
    pinWidget(widget: IWidget): void;
    closeWidget(): void;
    isWidgetLocked(widget: IWidget): boolean;
    isAssigned(item: IArticle): boolean;
    autosave(): void;
    updateItem(updates: Partial<IArticle>): void;
}

function AuthoringWidgetsProvider() {
    var widgets = [];

    /**
     * Register new widget
     *
     * @param {String} id
     * @param {Object} config Widget configuration
     *
     *   Object properties:

     *     - `badge` - `{Function}` - Injectable function to get badge number for item,
     *       gets `item` injected.
     *     - `badgeAsync` - `{Function}` - Injectable function to get badge number
     *       returning a promise, gets `item` injected.
     */
    this.widget = function(id, widget: IWidget) {
        widgets = widgets.filter((_widget) => _widget._id !== id);
        widgets.push(angular.extend({}, widget, {_id: id})); // make a new instance for every widget
    };

    this.$get = function() {
        const widgetsFromExtensions = flatMap(
            Object.values(extensions),
            (extension) => extension.activationResult?.contributions?.authoringSideWidgets ?? [],
        );

        return widgets.concat(widgetsFromExtensions);
    };
}

export const widgetReactIntegration = {
    pinWidget: noop as any,
    getActiveWidget: noop as any,
    getPinnedWidget: noop as any,
};

WidgetsManagerCtrl.$inject = ['$scope', '$routeParams', 'authoringWidgets', 'archiveService', 'authoringWorkspace',
    'keyboardManager', '$location', 'desks', 'lock', 'content', 'lodash', 'privileges',
    '$injector', 'preferencesService', '$rootScope'];
function WidgetsManagerCtrl(
    $scope: IScope,
    $routeParams,
    authoringWidgets: Array<IWidget>,
    archiveService,
    authoringWorkspace: AuthoringWorkspaceService,
    keyboardManager,
    $location,
    desks,
    lock,
    content,
    _,
    privileges,
    $injector,
    preferencesService,
    $rootScope,
) {
    $scope.active = null;

    preferencesService.get(USER_PREFERENCE_SETTINGS).then((preferences) =>
        this.widgetFromPreferences = preferences,
    );

    $scope.$watch('item', (item: IArticle) => {
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
            display = isKilled(item) ? 'killedItem' : 'authoring';
            if (item.type === 'composite') {
                display = 'packages';
            }
            if (item.type === 'picture') {
                display = 'picture';
            }
        }

        const widgets = authoringWidgets.filter((widget) => {
            if (widget.component != null) { // widgets from extensions are themselves in control of widget visibility
                return widget.isAllowed?.(item) ?? true;
            } else {
                return !!widget.display[display] &&
                // If the widget requires a feature configured, then test this
                // feature name against the config (defaulting to true)
                (!widget.feature || !!_.get(appConfig.features, widget.feature, true));
            }
        });

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

                if (this.widgetFromPreferences) {
                    let widgetFromPreferences = $scope.widgets.find((widget) =>
                        widget._id === this.widgetFromPreferences._id);

                    if (widgetFromPreferences) {
                        $scope.pinWidget(widgetFromPreferences);
                    }
                }

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

    $scope.isWidgetLocked = function(widget: IWidget) {
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

    $scope.pinWidget = (widget: IWidget) => {
        if ($scope.pinnedWidget) {
            $scope.pinnedWidget.pinned = false;
        }

        if (!PINNED_WIDGET_RESIZED && widget && !$scope.pinnedWidget) {
            $rootScope.$broadcast('resize:monitoring', -330);

            PINNED_WIDGET_RESIZED = true;
        }

        if (!widget || $scope.pinnedWidget === widget) {
            $rootScope.$broadcast('resize:monitoring', 330);

            angular.element('body').removeClass('main-section--pinned-tabs');

            $scope.pinnedWidget = null;
            PINNED_WIDGET_RESIZED = false;

            this.widgetFromPreferences = null;

            if (widget) {
                widget.pinned = false;
            }

            this.updateUserPreferences();
        } else {
            angular.element('body').addClass('main-section--pinned-tabs');
            $scope.pinnedWidget = widget;
            widget.pinned = true;

            this.updateUserPreferences(widget);
        }
    };

    widgetReactIntegration.pinWidget = $scope.pinWidget;
    widgetReactIntegration.getActiveWidget = () => $scope.active ?? $scope.pinnedWidget;

    this.updateUserPreferences = (widget?: IWidget) => {
        let update = [];

        update[USER_PREFERENCE_SETTINGS] = {
            type: 'string',
            _id: widget ? widget._id : null,
        };
        preferencesService.update(update);
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

            $scope.closeWidget();
            $scope.activate(widget);
        }
    });

    $scope.updateItem = (updates: Partial<IArticle>) => {
        $scope.$applyAsync(() => {
            angular.extend($scope.item, updates);
            $scope.autosave();
        });
    };

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
        link: function(scope) {
            scope.widget = null;
            scope.pinnedWidget = null;

            scope.userLookup = desks.userLookup;

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
                    return 'ctrl+alt+0';
                } else if (order > 10) {
                    return tooltip ? `ctrl+shift+${order - 10}` : `ctrl+shift+${shiftNums[order - 10]}`;
                }
            };

            scope.$on('$destroy', () => {
                angular.element('body').removeClass('main-section--pinned-tabs');

                if (scope.pinnedWidget) {
                    scope.pinnedWidget.pinned = false;
                }
            });

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
