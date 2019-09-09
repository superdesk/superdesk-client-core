import * as ctrl from '../controllers';
import {stripHtmlTags, getSuperdeskType} from 'core/utils';
import {addInternalEventListener} from 'core/internal-events';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemAssociation
 *
 * @requires superdesk
 * @requires renditions
 * @requires config
 * @requires authoring
 * @requires $q
 * @requires api
 * @requires notify
 * @requires mediaIdGenerator
 *
 * @description
 *   This directive is responsible for rendering media associated with the item.
 */

ItemAssociationDirective.$inject = ['renditions'];
export function ItemAssociationDirective(renditions) {
    return {
        scope: {
            rel: '=',
            fieldName: '=',
            item: '=',
            editable: '<',
            tabindex: '<',
            allowPicture: '<',
            allowVideo: '<',
            allowAudio: '<',
            onchange: '&',
            showTitle: '<',
            save: '&',
            maxUploads: '=',
        },
        controller: ctrl.AssociationController,
        controllerAs: 'associations',
        templateUrl: 'scripts/apps/authoring/views/item-association.html',
        link: function(scope, elem, attr, _ctrl) {
            const dragOverClass = 'dragover';

            const MEDIA_TYPES = [];

            if (scope.allowPicture) {
                MEDIA_TYPES.push('application/superdesk.item.picture');
                MEDIA_TYPES.push('application/superdesk.item.graphic');
            }

            if (scope.allowVideo) {
                MEDIA_TYPES.push('application/superdesk.item.video');
            }

            if (scope.allowAudio) {
                MEDIA_TYPES.push('application/superdesk.item.audio');
            }

            if (!elem.hasClass('no-drop-zone') && scope.editable) {
                // it should prevent default as long as this is valid image
                elem.on('dragover', (event) => {
                    if (MEDIA_TYPES.includes(getSuperdeskType(event))) {
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

                // update item associations on drop
                elem.on('drop dragdrop', (event) => {
                    // drop event should only fire if dragover event is prevented
                    // however, `ng-file-upload` library calls preventDefault on this event
                    // which it shouldn't do, since the element is not controlled by the library.
                    // Because of this, drop is triggered when it shouldn't have been on firefox, but not on chrome.
                    // The same media types check is added from `dragover` method to work around the situation.
                    if (MEDIA_TYPES.includes(getSuperdeskType(event))) {
                        removeDragOverClass();
                        event.preventDefault();
                        event.stopPropagation();
                        _ctrl.initializeUploadOnDrop(scope, event);
                        scope.$apply();
                    }
                });
            }

            const addDragOverClass = () => {
                elem.find('figure').addClass(dragOverClass);
                elem.find('button.item-association').addClass(dragOverClass);
            };

            const removeDragOverClass = () => {
                elem.find('figure').removeClass(dragOverClass);
                elem.find('button.item-association').removeClass(dragOverClass);
            };

            // init associated item for preview
            scope.$watch('item.associations[rel]', (related) => {
                scope.related = related;
            });

            renditions.get();

            /**
             * @ngdoc method
             * @name sdItemAssociation#remove
             * @public
             * @description Remove the associations
             */
            scope.remove = function(item) {
                _ctrl.updateItemAssociation(scope, null, item.fieldId);
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#upload
             * @public
             * @description Upload media.
             */
            scope.upload = function() {
                if (scope.editable) {
                    _ctrl.uploadAndCropImages(scope);
                }
            };

            scope.onMetadataChange = (field) => {
                scope.related[field] = stripHtmlTags(scope.related[field]);
                scope.onchange();
            };

            const removeAddImageEventListener = addInternalEventListener('addImage', (event) => {
                const {field, image} = event.detail;

                if (scope.fieldName === field) {
                    _ctrl.addAssociation(scope, image);
                }
            });

            scope.$on('$destroy', () => {
                removeAddImageEventListener();
            });
        },
    };
}
