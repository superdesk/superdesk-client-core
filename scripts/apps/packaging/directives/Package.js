export function Package() {
    var solveRefs = function(item, groups) {
        var items = {childId: '_items', childData: []};
        var tree = [items];

        _.each(item.refs, (ref) => {
            if (ref.idRef) {
                tree.push({childId: ref.idRef, childData: solveRefs(_.find(groups, {id: ref.idRef}), groups)});
            } else if (ref.residRef) {
                items.childData.push(ref);
            }
        });
        return tree;
    };

    return {
        templateUrl: 'scripts/apps/packaging/views/sd-package.html',
        scope: {
            item: '=',
            setitem: '&',
        },
        link: function(scope, elem, attrs) {
            scope.mode = attrs.mode || 'tree';
            scope.$watchGroup(['item', 'item.groups', 'item.deleted_groups'], () => {
                var isDeleted = scope.item.deleted_groups != null && scope.item.deleted_groups.length !== 0;
                var groups = isDeleted ? scope.item.deleted_groups : scope.item.groups;

                if (scope.item && groups) {
                    scope.tree = solveRefs(_.find(groups, {id: 'root'}), groups);
                }
            });
        },
    };
}
