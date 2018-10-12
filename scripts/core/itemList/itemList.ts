
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
    .directive('sdRelatedItemListWidget', ['notify', 'gettext', 'familyService', 'desks',
        function(notify, gettext, familyService, desks) {
            return {
                scope: {
                    options: '=',
                    itemListOptions: '=',
                    actions: '=',
                    loading: '=',
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
                        if (scope.options.related && scope.hasKeywords()) {
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
                 * @name sdRelatedItemListWidget#deskName
                 * @returns {String}
                 * @param {object} item
                 * @description Extracts the id of the desk the item is on and returns it's name
                 */
                    scope.deskName = (item) => desks.deskLookup[item.task.desk].name;

                    /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#deskStage
                 * @returns {String}
                 * @param {object} item
                 * @description Extracts the id of the stage the item is on and returns it's name
                 */
                    scope.deskStage = (item) => desks.stageLookup[item.task.stage].name;

                    /**
                 * @ngdoc method
                 * @name sdRelatedItemListWidget#setProcessedItems
                 * @description Creates or removes listeners
                 */
                    var setProcessedItems = () => {
                        if (scope.loading) {
                            return;
                        }

                        if (scope.options.existingRelations) {
                            scope.processedItems = scope.options.existingRelations;
                            if (itemListListener) {
                                itemListListener();
                            }
                            if (optionsListener) {
                                optionsListener();
                            }
                        } else {
                            optionsListener = scope.$watch('options.related', () => {
                                if (scope.options.related && scope.options.item) {
                                    if (!scope.options.item.slugline) {
                                        notify.error(gettext('Error: Slugline required.'));
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
                    scope.isPublished = (item) => _.includes(
                        ['published', 'killed', 'scheduled', 'corrected', 'recalled'],
                        item.state);

                    scope.$watchGroup(['options.item.slugline', 'options.existingRelations'], setProcessedItems);

                    scope.hasKeywords = () => scope.itemListOptions.keyword &&
                    scope.itemListOptions.keyword.trim().length >= 2;

                    scope.view = (item) => {
                        scope.selected = item;
                    };
                },
            };
        }]);
