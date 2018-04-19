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
            scope.$watchGroup(['item', 'item.groups'], () => {
                if (scope.item && scope.item.groups) {
                    scope.tree = solveRefs(
                        _.find(scope.item.groups, {id: 'root'}),
                        scope.item.groups
                    );
                }
            });
        },
    };
}
