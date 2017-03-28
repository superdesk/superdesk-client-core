
angular.module('superdesk.core.itemList', ['superdesk.apps.search'])
/**
 * @ngdoc directive
 * @module superdesk.core.itemList
 * @name sdRelatedItemListWidget
 * @param {object} options
 * @param {object} itemListOptions
 * @param {object} actions
 * @param {object} loading
 * @description Creates a list of stories to appear in related items widget.
 */
.directive('sdRelatedItemListWidget', ['notify', 'gettext', 'familyService',
    function(notify, gettext, familyService) {
        return {
            scope: {
                options: '=',
                itemListOptions: '=',
                actions: '=',
                loading: '='
            },
            templateUrl: 'scripts/core/itemList/views/relatedItem-list-widget.html',
            link: function(scope, element, attrs) {
                scope.items = null;
                scope.processedItems = null;
                scope.selected = null;
                var oldSearch = null;
                var itemListListener = null;
                var optionsListener = null;

                /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#refresh
                 * @description Fetches and assigns relatable items
                 */
                scope.refresh = () => {
                    if (scope.options.related &&
                    scope.itemListOptions.keyword &&
                    scope.itemListOptions.keyword.trim().length >= 2) {
                        scope.loading = true;
                        familyService.fetchRelatableItems(scope.itemListOptions.keyword,
                            scope.itemListOptions.sluglineMatch,
                            scope.options.item.event_id,
                            scope.itemListOptions.modificationDateAfter).then((items) => {
                                scope.processedItems = items._items;
                            })
                            .finally(() => {
                                scope.loading = false;
                            });
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#canDisplayItem
                 * @returns {Boolean}
                 * @param {object} item
                 * @description Checks if an item should be displayed in the list
                 */
                scope.canDisplayItem = (item) => {
                    if (!scope.options.searchEnabled) {
                        return true;
                    }

                    return scope.actions.update && scope.actions.update.condition(item) ||
                    scope.actions.addTake && scope.actions.addTake.condition(item);
                };

                /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#setProcessedItems
                 * @description Creates or removes listeners
                 */
                var setProcessedItems = () => {
                    if (scope.options.existingRelations) {
                        scope.processedItems = scope.options.existingRelations;
                        itemListListener && itemListListener();
                        optionsListener && optionsListener();
                    } else {
                        optionsListener = scope.$watch('options.related', () => {
                            if (scope.options.related && scope.options.item) {
                                if (!scope.options.item.slugline) {
                                    notify.error(gettext('Error: Slugline required.'));
                                    scope.options.related = false;
                                } else {
                                    oldSearch = scope.itemListOptions.keyword;
                                    scope.itemListOptions.keyword = scope.options.item.slugline;
                                    scope.refresh();
                                }
                            } else {
                                scope.itemListOptions.keyword = oldSearch || null;
                            }
                        });
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#isPublished
                 * @returns {Boolean}
                 * @param {object} item
                 * @description Checks if an item is in published state
                 */
                scope.isPublished = (item) => _.includes(['published', 'killed', 'scheduled', 'corrected'],
                    item.state);

                scope.$watch('options.existingRelations', (newVal, oldVal) => {
                    if (newVal !== oldVal) {
                        setProcessedItems();
                    }
                });

                scope.view = (item) => {
                    scope.selected = item;
                };
            }
        };
    }]);