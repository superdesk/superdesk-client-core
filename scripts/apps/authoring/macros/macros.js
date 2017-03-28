/**
 * @ngdoc service
 * @module superdesk.apps.authoring.macros
 * @name macros
 * @requires api
 * @requires notify
 * @description MacrosService provides set of methods which allows fetching of macros
 * and triggering of macros to be apply on provided item
 */
MacrosService.$inject = ['api', 'notify'];
function MacrosService(api, notify) {
    /**
     * Recursively returns all macros
     *
     * @return {*}
     */
    var _getAllMacros = function(criteria = {}, page = 1, macros = []) {
        return api.query('macros', _.extend({max_results: 200, page: page}, criteria), null, true)
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

/**
 * @ngdoc controller
 * @module superdesk.apps.authoring.macros
 * @name Macros
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires macros
 * @requires desks
 * @requires autosave
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires storage
 * @description MacrosController holds a set of convenience functions used by macros widget
 */
MacrosController.$inject = ['$scope', 'macros', 'desks', 'autosave', '$rootScope', 'storage'];
function MacrosController($scope, macros, desks, autosave, $rootScope, storage) {
    let expandedGroup = storage.getItem('expandedGroup') || [];

    $scope.loading = true;

    macros.get().then(() => {
        let currentDeskId = desks.getCurrentDeskId();

        if (currentDeskId !== null) {
            macros.getByDesk(desks.getCurrentDesk().name).then((_macros) => {
                displayMacros(_macros);
            });
        } else {
            displayMacros(macros.macros);
        }
    })
    .finally(() => {
        $scope.loading = false;
    });

    /**
     * @ngdoc method
     * @name Macros#displayMacros
     * @private
     * @param {Array<object>} macros - each of macro contains name, label, group, order etc.
     * @description displays the list of fetched macros
     */
    function displayMacros(fetchedMacros) {
        $scope.macros = fetchedMacros;

        // grouped macros list
        let macrosByGroup = _.groupBy(_.filter($scope.macros, 'group'), 'group');

        $scope.groupedMacros = _.isEmpty(macrosByGroup) ? null : macrosByGroup;

        // provide grouping macros list option and prepare list, if group available.
        if ($scope.groupedMacros) {
            $scope.groupedList = true;
            prepareMacrosList($scope.macros);
        } else {
            $scope.groupedList = false;
        }
    }

    /**
     * @ngdoc method
     * @name Macros#call
     * @param {Object} macro - contains name, label, group, order etc.
     * @returns {Promise} - If resolved then macro is applied successfully
     * @description
     * Triggers macros service call to apply the provided macro on opened article
     */
    $scope.call = function(macro) {
        let item = _.extend({}, $scope.origItem, $scope.item);

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

    /**
     * @ngdoc method
     * @name Macros#prepareMacrosList
     * @private
     * @param {Array<object>} macros - each of macro contains name, label, group, order etc.
     * @description Prepares sections for list of macros, which includes quick, grouped and
     * miscellaneous set of macros for display
     */
    function prepareMacrosList(allMacros) {
        // macros quick list, i.e. where order is defined
        $scope.quickList = _.filter(allMacros, 'order');

        // miscellaneous macros list, i.e, where group is not defined
        $scope.miscMacros = _.filter(allMacros, (o) => o.group === undefined);

        // sort grouped macros
        let ordered = {};

        Object.keys($scope.groupedMacros)
        .sort()
        .forEach((key) => {
            ordered[key] = _.sortBy($scope.groupedMacros[key], 'label');
        });

        // sorted grouped macros
        $scope.orderedGroupedMacros = ordered;
    }

    /**
     * @ngdoc method
     * @name Macros#getGroupStatus
     * @param {String} group - key that represents macro group, like area, currency etc.
     * @returns {Boolean}
     * @description gets the remembered toggle status of provided group,
     * retrieved from local storage
     */
    $scope.getGroupStatus = function(group) {
        return _.includes(expandedGroup, group);
    };

    /**
     * @ngdoc method
     * @name Macros#setGroupStatus
     * @param {String} group - key that represents macro group, like area, currency etc.
     * @description sets the toggle status of provided group to be remember in local storage
     */
    $scope.setGroupStatus = function(group) {
        let index = expandedGroup.indexOf(group);

        if (index > -1) {
            expandedGroup.splice(index, 1);
        } else {
            expandedGroup.push(group);
        }

        storage.setItem('expandedGroup', expandedGroup);
    };
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.macros
 * @name sdMacrosReplace
 * @requires editor
 * @description sd-macro-replace performs the necessary replacement on editor's item in order to
 * apply the results of triggered macro with the use of available set of methods such that next,
 * prev and replace
 */
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

/**
 * @ngdoc module
 * @module superdesk.apps.authoring.macros
 * @name superdesk.apps.authoring.macros
 * @packageName superdesk.apps
 * @description Superdesk module that allows managing and using macros
 */
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
