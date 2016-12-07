MacrosService.$inject = ['api', 'notify'];
function MacrosService(api, notify) {
    /**
     * Recursively returns all macros
     *
     * @return {*}
     */
    var _getAllMacros = function(criteria = {}, page = 1, macros = []) {
        return api.query('macros', _.extend({max_results: 200, page: page}, criteria))
            .then((result) => {
                let all = macros.concat(result._items);
                let pg = page;

                if (result._links.next) {
                    pg++;
                    return _getAllMacros(criteria, pg, all);
                }

                return _.sortBy(all, ['order', 'label']);
            });
    };

    /**
     * Returns all frontend macros if includeBackend is false or none
     * If includeBackend is true then results will include the backend macros
     *
     * @param {bool} includeBackend
     */
    this.get = function(includeBackend) {
        return _getAllMacros({backend: !!includeBackend}).then(angular.bind(this, function(macros) {
            this.macros = macros;
            return this.macros;
        }));
    };

    /**
     * Returns all frontend macros for a given desk if includeBackend is false or none
     * If includeBackend is true then results will include the backend macros for hat desk
     *
     * @param {string} desk
     * @param {bool} includeBackend
     */
    this.getByDesk = function(desk, includeBackend) {
        return _getAllMacros({desk: desk, backend: !!includeBackend}).then(angular.bind(this, function(macros) {
            this.macros = macros;
            return this.macros;
        }));
    };

    this.setupShortcuts = function($scope) {
        this.get().then((macros) => {
            angular.forEach(macros, (macro) => {
                if (macro.shortcut) {
                    $scope.$on('key:ctrl:' + macro.shortcut, () => {
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
        }).then((res) => res, (err) => {
            if (angular.isDefined(err.data._message)) {
                notify.error(gettext('Error: ' + err.data._message));
            }
        });
    }
}

MacrosController.$inject = ['$scope', 'macros', 'desks', 'autosave', '$rootScope'];
function MacrosController($scope, macros, desks, autosave, $rootScope) {
    $scope.loading = true;

    macros.get().then(() => {
        var currentDeskId = desks.getCurrentDeskId();

        if (currentDeskId !== null) {
            macros.getByDesk(desks.getCurrentDesk().name).then((_macros) => {
                $scope.macros = _macros;
            });
        } else {
            $scope.macros = macros.macros;
        }
    })
    .finally(() => {
        $scope.loading = false;
    });

    $scope.call = function(macro) {
        var item = _.extend({}, $scope.origItem, $scope.item);

        $scope.loading = true;
        return macros.call(macro, item).then((res) => {
            if (!res.diff) {
                angular.extend($scope.item, _.omit(res.item, ['_etag']));
                autosave.save($scope.item, $scope.origItem);
            } else {
                $rootScope.$broadcast('macro:diff', res.diff);
            }
            $scope.closeWidget();
        })
       .finally(() => {
           $scope.loading = false;
       });
    };
}

MacrosReplaceDirective.$inject = ['editor'];
function MacrosReplaceDirective(editor) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/authoring/macros/views/macros-replace.html',
        link: function(scope) {
            scope.diff = null;

            scope.$on('macro:diff', (evt, diff) => {
                scope.diff = diff;
                init(scope.diff);
            });

            function init(diff) {
                if (diff) {
                    scope.noMatch = Object.keys(diff || {}).length;
                    editor.setSettings({findreplace: {diff: diff}});
                    editor.render();
                    editor.selectNext();
                    scope.preview = getCurrentReplace();
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

angular.module('superdesk.apps.authoring.macros', [
    'superdesk.core.api',
    'superdesk.core.notify',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.authoring.autosave'
])

    .service('macros', MacrosService)
    .controller('Macros', MacrosController)
    .directive('sdMacrosReplace', MacrosReplaceDirective)

    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('macros', {
                icon: 'macros',
                label: gettext('Macros'),
                template: 'scripts/apps/authoring/macros/views/macros-widget.html',
                order: 6,
                needEditable: true,
                side: 'right',
                display: {authoring: true, packages: true, killedItem: false, legalArchive: false, archived: false}
            });
    }]);
