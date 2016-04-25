(function() {

'use strict';

MacrosService.$inject = ['api', 'notify'];
function MacrosService(api, notify) {

    this.get = function() {
        return api.query('macros')
            .then(angular.bind(this, function(macros) {
                this.macros = macros._items;
                return this.macros;
            }));
    };

    this.getByDesk = function(desk, includeBackend) {
        return api.query('macros', {'desk': desk, 'backend': !!includeBackend})
            .then(angular.bind(this, function(macros) {
                this.macros = macros._items;
                return this.macros;
            }));
    };

    this.setupShortcuts = function ($scope) {
        this.get().then(function(macros) {
            angular.forEach(macros, function(macro) {
                if (macro.shortcut) {
                    $scope.$on('key:ctrl:' + macro.shortcut, function() {
                        triggerMacro(macro, $scope.item);
                    });
                }
            });
        });
    };

    this.call = triggerMacro;

    function triggerMacro(macro, item, commit) {
        return api.save('macros', {
            macro: macro.name,
            item: item,
            commit: !!commit
        }).then(function(res) {
            return res;
        }, function(err) {
            if (angular.isDefined(err.data._message)) {
                notify.error(gettext('Error: ' + err.data._message));
            }
        });
    }
}

MacrosController.$inject = ['$scope', 'macros', 'desks', 'autosave', '$rootScope'];
function MacrosController($scope, macros, desks, autosave, $rootScope) {
    macros.get().then(function() {
        var currentDeskId = desks.getCurrentDeskId();
        if (currentDeskId !== null) {
            macros.getByDesk(desks.getCurrentDesk().name).then(function(_macros) {
                $scope.macros = _macros;
            });
        } else {
            $scope.macros = macros.macros;
        }
    });
    $scope.call = function(macro) {
        var item = _.extend({}, $scope.origItem, $scope.item);
        return macros.call(macro, item).then(function(res) {
            if (!res.diff) {
                angular.extend($scope.item, res.item);
                autosave.save($scope.item);
            } else {
                $rootScope.$broadcast('macro:diff', res.diff);
            }
            $scope.closeWidget();
        });
    };
}

MacrosReplaceDirective.$inject = ['macros', 'editor'];
function MacrosReplaceDirective(macros, editor) {
    return {
        scope: true,
        templateUrl: 'scripts/superdesk-authoring/macros/views/macros-replace.html',
        link: function(scope) {
            scope.diff = null;

            scope.$on('macro:diff', function(evt, diff) {
                scope.diff = diff;
                init(scope.diff);
            });

            function init(diff) {
                if (diff) {
                    scope.noMatch = Object.keys(diff || {}).length;
                    editor.setSettings({findreplace: {diff: diff}});
                    editor.render();
                    scope.next();
                } else {
                    editor.setSettings({findreplace: null});
                    editor.render();
                }
            }

            scope.next = function() {
                editor.selectNext();
                scope.preview = getCurrentReplace();
            };

            scope.prev = function() {
                editor.selectPrev();
                scope.preview = getCurrentReplace();
            };

            scope.replace = function() {
                var to = getCurrentReplace();
                if (to) {
                    editor.replace(to);
                    editor.selectNext();
                }
                scope.preview = getCurrentReplace();
            };

            scope.close = function() {
                scope.diff = null;
                init(scope.diff);
            };

            function getCurrentReplace() {
                var from = editor.getActiveText();
                return scope.diff[from] || null;
            }

            init(scope.diff);
        }
    };
}

angular.module('superdesk.authoring.macros', [
    'superdesk.api',
    'superdesk.notify',
    'superdesk.authoring.widgets',
    'superdesk.authoring.autosave'
])

    .service('macros', MacrosService)
    .controller('Macros', MacrosController)
    .directive('sdMacrosReplace', MacrosReplaceDirective)

    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('macros', {
                icon: 'macros',
                label: gettext('Macros'),
                template: 'scripts/superdesk-authoring/macros/views/macros-widget.html',
                order: 6,
                needEditable: true,
                side: 'right',
                display: {authoring: true, packages: true, killedItem: false, legalArchive: false, archived: false},
                afterClose: function(scope) {
                    if (scope && typeof scope.closePreview === 'function') {
                        scope.closePreview();
                    }
                }
            });
    }]);
})();
