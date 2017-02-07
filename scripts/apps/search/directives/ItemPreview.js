ItemPreview.$inject = ['asset', 'storage', 'desks'];
export function ItemPreview(asset, storage, desks) {
    /**
     * @description Closes the preview panel if the currently previewed
     * item is spiked / unspiked or moved.
     * @param {Object} scope - angular scope
     * @param {Object} _ - event data (unused)
     * @param {Object=} args - the item that was spiked/unspiked/moved
     */
    function shouldClosePreview(scope, _, args) {
        // if preview pane currently previewed then close
        if (_.name === 'content:update' && scope.item && args &&
                Object.keys(args.items)[0] === scope.item._id) {
            scope.close();
        } else if (scope.item && args && args.item === scope.item._id) {
            scope.close();
        }
    }

    return {
        templateUrl: asset.templateUrl('apps/search/views/item-preview.html'),
        scope: {
            item: '=',
            close: '&',
            openLightbox: '=',
            openSingleItem: '=',
            hideActionsMenu: '=',
            showHistoryTab: '='
        },
        link: function(scope) {
            scope.tab = 'content';

            scope.toggleLeft = JSON.parse(storage.getItem('shiftLeft'));

            /**
             * Toggle preview pane position - left or right
             * available only when screen size is smaller and authoring is open.
             */
            scope.shiftPreview = function() {
                scope.$applyAsync(() => {
                    scope.toggleLeft = !scope.toggleLeft;
                    storage.setItem('shiftLeft', scope.toggleLeft);
                });
            };

            scope.$watch('item', (item) => {
                scope.selected = {preview: item || null};

                // Set the desk and stage names
                if (item && item.task && item.task.stage) {
                    scope.deskName = desks.deskLookup[item.task.desk].name;
                    scope.stage = desks.stageLookup[item.task.stage].name;
                } else {
                    scope.deskName = scope.stage = null;
                }
            });

            var closePreviewEvents = [
                'item:deleted',
                'item:unlink',
                'item:spike',
                'item:unspike',
                'item:move',
                'content:update'];

            angular.forEach(closePreviewEvents, function(event) {
                scope.$on(event, shouldClosePreview.bind(this, scope));
            });

            /**
             * Return true if the menu actions from
             * preview should be hidden
             *
             * @return {boolean}
             */
            scope.hideActions = function() {
                return scope.hideActionsMenu;
            };
        }
    };
}
