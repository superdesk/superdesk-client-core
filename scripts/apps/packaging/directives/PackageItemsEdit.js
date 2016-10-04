PackageItemsEdit.$inject = ['packages', 'notify'];
export function PackageItemsEdit(packages, notify) {
    return {
        scope: false,
        require: 'ngModel',
        templateUrl: 'scripts/apps/packaging/views/sd-package-items-edit.html',
        link: function(scope, elem, attrs, ngModel) {
            scope.$on('package:addItems', function(event, data) {
                var groupIndex = _.findIndex(scope.list, {id: data.group});
                if (groupIndex === -1) {
                    scope.list.push({id: data.group, items: []});
                    groupIndex = scope.list.length - 1;
                }
                for (var i = 0; i < data.items.length; i++) {
                    if (isAdded(data.items[i])) {
                        notify.error(gettext('Item is already in this package.'));
                    } else {
                        scope.list[groupIndex].items.unshift(packages.getReferenceFor(data.items[i]));
                    }
                }
                autosave();
            });
            scope.$on('$destroy', function() {
                packages.packageGroupItems = {};
            });

            ngModel.$render = function() {
                scope.list = ngModel.$viewValue || [];
            };

            ngModel.$parsers.unshift(function(viewValue) {
                var groups = null;
                if (viewValue && viewValue.list) {
                    groups = [];
                    groups.push({
                        role: 'grpRole:NEP',
                        refs: _.map(viewValue.list, function(r) {
                            return {idRef: r.id};
                        }),
                        id: 'root'
                    });
                    _.each(viewValue.list, function(l) {
                        groups.push({
                            id: l.id,
                            role: 'grpRole:' + l.id,
                            refs: l.items
                        });
                    });
                }
                return groups;
            });

            ngModel.$formatters.unshift(function(modelValue) {

                var root = _.find(modelValue, {id: 'root'});
                if (typeof root === 'undefined') {
                    return;
                }

                var firstLevelGroups = _.map(root.refs, function(group) {
                    return {
                        id: group.idRef,
                        items: []
                    };
                });

                _.each(firstLevelGroups, function(group) {
                    group.items = visit(group.id);
                });

                function visit(group_id) {
                    var _group = _.find(modelValue, {id: group_id});
                    var items = [];
                    _.each(_group.refs, function(ref) {
                        if (_isNode(ref)) {
                            items = _.union(items, visit(ref.idRef));
                        } else {
                            items.push(ref);
                        }
                    });
                    return items;
                }

                function _isNode(obj) {
                    return angular.isDefined(obj.idRef);
                }

                return firstLevelGroups;
            });

            scope.remove = function(group_id, residRef) {
                var group = _.find(scope.list, {id: group_id});
                var item = _.find(group.items, {residRef: residRef});
                _.remove(group.items, {residRef: residRef});
                packages.removePackageGroupItem(group, item);
                autosave();
            };

            scope.reorder = function(start, end) {
                var src = _.find(scope.list, {id: start.group});
                var dest = _.find(scope.list, {id: end.group});
                if (start.index !== end.index || start.group !== end.group) {
                    var item = src.items.splice(start.index, 1)[0];
                    dest.items.splice(end.index, 0, item);
                    packages.addPackageGroupItem(dest, item, false);
                } else {
                    //just change the address
                    dest.items = _.cloneDeep(dest.items);
                }
                autosave();
            };

            function autosave() {
                ngModel.$setViewValue({list: scope.list});
                scope.autosave(scope.item);
            }

            function isAdded(item) {
                return scope.list.some(function(group) {
                    return group.items.some(function(i) {
                        return i.residRef === item._id;
                    });
                });
            }
        }
    };
}
