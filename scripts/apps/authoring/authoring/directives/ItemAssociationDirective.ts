import * as ctrl from '../controllers';
import {stripHtmlTags} from 'core/utils';

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
 * @requires gettext
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
            item: '=',
            editable: '<',
            tabindex: '<',
            allowPicture: '<',
            allowVideo: '<',
            allowAudio: '<',
            _onchange: '&onchange',
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

            if (!elem.hasClass('no-drop-zone')) {
                // it should prevent default as long as this is valid image
                elem.on('dragover', (event) => {
                    if (MEDIA_TYPES.indexOf(_ctrl.getSuperdeskType(event)) > -1) {
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
                    removeDragOverClass();
                    event.preventDefault();
                    event.stopPropagation();

                    _ctrl.initializeUploadOnDrop(scope, event);
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

            scope.onchange = (field) => {
                scope.related[field] = stripHtmlTags(scope.related[field]);
                scope._onchange();
            };
        },
    };
}
