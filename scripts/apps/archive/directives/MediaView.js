MediaView.$inject = ['keyboardManager', 'packages'];

export function MediaView(keyboardManager, packages) {
    return {
        templateUrl: 'scripts/apps/archive/views/media-view.html',
        scope: {
            items: '=',
            item: '=',
            close: '&',
        },
        link: function(scope, elem) {
            var packageStack = [];

            scope.singleItem = null;
            scope.packageItem = null;

            scope.prevEnabled = true;
            scope.nextEnabled = true;

            var getIndex = function(item) {
                return _.findIndex(scope.items, {_id: item._id});
            };

            var setItem = function(item) {
                resetStack();
                scope.item = item;
                scope.openItem(item);
                var index = getIndex(scope.item);

                scope.prevEnabled = index > -1 && !!scope.items[index - 1];
                scope.nextEnabled = index > -1 && !!scope.items[index + 1];
            };

            scope.prev = function() {
                var index = getIndex(scope.item);

                if (index > 0) {
                    setItem(scope.items[index - 1]);
                }
            };
            scope.next = function() {
                var index = getIndex(scope.item);

                if (index !== -1 && index < scope.items.length - 1) {
                    setItem(scope.items[index + 1]);
                }
            };

            keyboardManager.push('left', scope.prev);
            keyboardManager.push('right', scope.next);
            scope.$on('$destroy', () => {
                keyboardManager.pop('left');
                keyboardManager.pop('right');
            });

            scope.setPackageSingle = function(packageItem) {
                packages.fetchItem(packageItem).then((item) => {
                    scope.openItem(item);
                });
            };

            scope.openItem = function(item) {
                if (item.type === 'composite') {
                    packageStack.push(item);
                    pickPackageItem();
                }
                scope.setSingleItem(item);
            };

            scope.setSingleItem = function(item) {
                scope.singleItem = item;
            };

            scope.nested = function() {
                return packageStack.length > 1;
            };

            scope.previousPackage = function() {
                _.remove(packageStack, _.last(packageStack));
                pickPackageItem();
                scope.setSingleItem(scope.packageItem);
            };

            var pickPackageItem = function() {
                scope.packageItem = _.last(packageStack) || null;
            };

            var resetStack = function() {
                packageStack = [];
                scope.packageItem = null;
            };

            setItem(scope.item);
        },
    };
}
