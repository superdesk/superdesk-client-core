(function() {

'use strict';

MacrosService.$inject = ['api', 'autosave', 'notify', 'editor'];
function MacrosService(api, autosave, notify, editor) {

    var self = this;

    this.get = function() {
        return api.query('macros')
            .then(angular.bind(this, function(macros) {
                this.macros = macros._items;
                return this.macros;
            }));
    };

    this.getByDesk = function(desk) {
        return api.query('macros', {'desk': desk})
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
            item: item, // get all the properties as shallow copy
            commit: !!commit
        }).then(function(res) {
            if (res.diff) {
                self.diff = res.diff;
            }
            return res.item;
        }, function(err) {
            if (angular.isDefined(err.data._message)) {
                notify.error(gettext('Error: ' + err.data._message));
            }
        });
    }
}

MacrosController.$inject = ['$scope', 'macros', 'desks', 'autosave'];
function MacrosController($scope, macros, desks, autosave) {
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
            angular.extend($scope.item, res);
            autosave.save($scope.item);
        });
    };
}

MacrosReplaceDirective.$inject = ['macros', 'editor'];
function MacrosReplaceDirective(macros, editor) {
    return {
        scope: true,
        templateUrl: 'scripts/superdesk-authoring/macros/views/macros-replace.html',
        link: function(scope) {

            scope.$watch(function() {
                return macros.diff;
            }, function(diff) {
                scope.diff = diff;
                if (diff) {
                    scope.noMatch = Object.keys(diff || {}).length;
                    editor.setSettings({findreplace: {diff: diff}});
                    editor.render();
                    scope.next();
                } else {
                    editor.setSettings({findreplace: null});
                    editor.render();
                }
            });

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
            };

            scope.close = function() {
                macros.diff = null;
            };

            function getCurrentReplace() {
                var from = editor.getActiveText();
                return macros.diff[from] || null;
            }
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
                display: {authoring: true, packages: true, killedItem: false, legalArchive: false, archived: false}
            });
    }]);
})();
