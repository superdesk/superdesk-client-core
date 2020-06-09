/**
 * @ngdoc directive
 * @module superdesk.apps.ItemPreview
 * @name sdItemPreview
 *
 * @requires asset
 * @requires storage
 * @requires desks
 * @requires lodash
 * @requires familyService
 * @requires privileges
 *
 * @description Handles the functionality of previewing content item.
 */
ItemPreview.$inject = ['asset', 'storage', 'desks', 'lodash', 'familyService', 'privileges'];
export function ItemPreview(asset, storage, desks, _, familyService, privileges) {
    /**
     * @description Closes the preview panel if the currently previewed
     * item is spiked / unspiked or moved.
     * @param {Object} scope - angular scope
     * @param {Object} _ - event data (unused)
     * @param {Object=} args - the item that was spiked/unspiked/moved
     */
    function shouldClosePreview(scope, __, args) {
        // if preview pane currently previewed then close
        if (__.name === 'content:update' && scope.item && args &&
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
            showHistoryTab: '=',
        },
        controller: function() {
            this.current_tab = 'content';
        },
        controllerAs: 'vm',
        link: function(scope) {
            scope.showRelatedTab = false;
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

            scope.$watch('item', (newItem, oldItem) => {
                scope.selected = {preview: newItem || null};
                scope.links = [];

                if (newItem !== oldItem) {
                    const isMedia = newItem?.type != null &&
                        ['audio', 'video', 'picture', 'graphic'].includes(newItem.type);

                    fetchRelatedItems();

                    // Set the desk and stage names
                    if (newItem && newItem.task && newItem.task.stage) {
                        scope.deskName = desks.deskLookup[newItem.task.desk].name;
                        scope.stage = desks.stageLookup[newItem.task.stage].name;
                    } else {
                        scope.deskName = scope.stage = null;
                    }

                    // item is associated to an assignment
                    scope.isAssigned = _.get(scope, 'item.assignment_id') && _.get(privileges, 'privileges.planning');

                    if (isMedia && (newItem.used || newItem._type === 'ingest')) {
                        familyService.fetchLinks(newItem).then((links) => {
                            scope.$applyAsync(() => {
                                scope.links = links;
                            });
                        });
                    }

                    if (scope.vm.current_tab === 'assignment' && !scope.isAssigned) {
                        scope.vm.current_tab = 'content';
                    }
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

            scope.$on('item:duplicate', fetchRelatedItems);

            /**
             * Reload the related items when navigating to the 'Duplicates' tab to ensure the list is current
             */
            scope.$watch('vm.current_tab', (newTab, oldTab) => {
                if (newTab !== oldTab && newTab === 'related') {
                    fetchRelatedItems();
                }
            });

            /**
             * Fetch related items to the current scope.item
             * This is then used to calculate if we show the 'Duplicates' tab,
             * as well as passed to the sd-media-related directive so we don't
             * double up with this api call
             */
            function fetchRelatedItems() {
                if (scope.item && ['archive', 'archived', 'published'].includes(scope.item._type)
                    && scope.item.family_id) {
                    familyService.fetchItems(scope.item.family_id, scope.item)
                        .then(setRelatedItems);
                } else {
                    setRelatedItems(null);
                }
            }

            /**
             * Sets the scope.relatedItems to the items provided,
             * Then calculates if we should change th current tab to the default one, `content`.
             * This get's around an issue where a previews an item, selects the `duplicates` tab,
             * Then selects a different item that doesn't have duplicates, the duplicate tab is hidden
             * But the duplicate tab is still selected.
             *
             * @param items: List of related items to scope.item
             */
            function setRelatedItems(items) {
                scope.relatedItems = items;
                scope.showRelatedTab = items && items._items.length > 0;
                if (!scope.showRelatedTab && scope.vm.current_tab === 'related') {
                    scope.vm.current_tab = 'content';
                }
            }
        },
    };
}
