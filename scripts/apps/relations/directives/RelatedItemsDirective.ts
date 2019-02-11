import {get} from 'lodash';
import {getSuperdeskType} from 'core/utils';
import {gettext} from 'core/utils';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdRelatedItems
 *
 * @description
 * This directive is responsible for rendering related items and support operations as reordering,
 * add related items by using drag and drop, delete related items and open related items.
 */

RelatedItemsDirective.$inject = ['authoringWorkspace', 'relationsService', 'notify'];
export function RelatedItemsDirective(authoringWorkspace, relationsService, notify) {
    return {
        scope: {
            item: '=',
            editable: '<',
            field: '<',
            onchange: '&onchange',
        },
        templateUrl: 'scripts/apps/relations/views/related-items.html',
        link: function(scope, elem, attr) {
            const dragOverClass = 'dragover';
            const allowed = ((scope.field || {}).field_options || {}).allowed_types || {};
            const ALLOWED_TYPES = Object.keys(allowed)
                .filter((key) => allowed[key] === true)
                .map((key) => 'application/superdesk.item.' + key);

            if (!elem.hasClass('no-drop-zone') && scope.editable) {
                elem.on('dragover', (event) => {
                    if (ALLOWED_TYPES.includes(getSuperdeskType(event))) {
                        event.preventDefault();
                        event.stopPropagation();
                        addDragOverClass();
                    } else {
                        removeDragOverClass();
                    }
                });

                elem.on('dragleave', () => {
                    removeDragOverClass();
                });

                elem.on('drop dragdrop', (event) => {
                    removeDragOverClass();
                    event.preventDefault();
                    event.stopPropagation();

                    const relatedItemsForCurrentField = Object.keys(scope.item.associations || {})
                        .filter((key) => key.startsWith(scope.field._id) && scope.item.associations[key] != null)
                        .map((key) => scope.item.associations[key]);

                    const currentCount = relatedItemsForCurrentField.length;
                    const maxCount = get(scope, 'field.field_options.multiple_items.enabled') === true
                        ? get(scope, 'field.field_options.multiple_items.max_items')
                        : 1;

                    const type = getSuperdeskType(event, false);
                    const item = angular.fromJson(event.originalEvent.dataTransfer.getData(type));

                    const itemAlreadyAddedAsRelated = relatedItemsForCurrentField.some(
                        (relatedItem) => relatedItem._id === item._id,
                    );

                    if (scope.item._id === item._id) {
                        notify.error('Cannot add self as related item.');
                        return;
                    }

                    if (itemAlreadyAddedAsRelated) {
                        notify.error('This item is already added as related.');
                        return;
                    }

                    if (currentCount >= maxCount) {
                        notify.error(
                            gettext(
                                'Related item was not added, because the field '
                                + 'reached the limit of related items allowed.',
                            ),
                        );
                        return;
                    }

                    scope.addRelatedItem(item);
                });
            }

            const addDragOverClass = () => {
                elem.find('.item-association').addClass(dragOverClass);
                elem.find('.related-items').addClass(dragOverClass);
            };

            const removeDragOverClass = () => {
                elem.find('.item-association').removeClass(dragOverClass);
                elem.find('.related-items').removeClass(dragOverClass);
            };

            /**
             * Get related items keys for fireldId
             *
             * @param {Object} item
             * @param {String} fieldId
             * @return {[String]}
             */
            function getRelatedKeys(item, fieldId) {
                return relationsService.getRelatedKeys(item, fieldId);
            }

            /**
            * Return true if there are association for current field
            *
            * @param {String} fieldId
            * @return {Boolean}
            */
            scope.isEmptyRelatedItems = (fieldId) => {
                const keys = Object.keys(scope.item.associations || {})
                    .filter((key) => key.startsWith(fieldId) && scope.item.associations[key] != null);

                return keys.length === 0;
            };

            /**
            * Get related items for fieldId
            *
            * @param {String} fieldId
            * @return {[Object]}
            */
            scope.refreshRelatedItems = () => {
                scope.loading = true;
                relationsService.getRelatedItemsForField(scope.item, scope.field._id)
                    .then((items) => {
                        scope.relatedItems = items;
                        scope.loading = false;
                    });
            };
            scope.refreshRelatedItems();

            /**
             * Reorder related items on related items list
             *
             * @param {int} start
             * @param {int} end
             */
            scope.reorder = (start, end) => {
                if (!scope.editable) {
                    return;
                }
                const related = getRelatedKeys(scope.item, scope.field._id);
                const newRelated = related.slice(0);

                newRelated.splice(end.index, 0, newRelated.splice(start.index, 1)[0]);

                const updated = related.reduce((obj, key, index) => {
                    obj[key] = scope.item.associations[newRelated[index]];
                    return obj;
                }, {});

                scope.item.associations = angular.extend({}, scope.item.associations, updated);
                scope.onchange();
            };

            /**
             * Return the next key for related item associated to current field
             *
             * @param {Object} associations
             * @param {String} fieldId
             * @return {int} nextKey
             */
            function getNextKey(associations, fieldId) {
                for (let i = 1; ; i++) {
                    const key = fieldId + '--' + i;

                    if (associations[key] == null) {
                        return key;
                    }
                }
            }

            /**
             * Add a new related item for current field
             *
             * @param {Object} item
             */
            scope.addRelatedItem = (item) => {
                const key = getNextKey(scope.item.associations || {}, scope.field._id);
                let data = {};

                data[key] = {_id: item._id};
                scope.item.associations = angular.extend({}, scope.item.associations, data);
                scope.onchange();
            };

            /**
             * Remove the related item with key
             *
             * @param {int} key
             */
            scope.removeRelatedItem = (key) => {
                if (!scope.editable) {
                    return;
                }
                let data = {};

                data[key] = null;
                scope.item.associations = angular.extend({}, scope.item.associations, data);
                scope.onchange();
            };
            /**
             * Open related item
             *
             * @param {Object} item
             */
            scope.openRelatedItem = (item) => {
                authoringWorkspace.edit(item);
            };

            scope.$watchCollection('item.associations', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    scope.refreshRelatedItems();
                }
            });
        },
    };
}
