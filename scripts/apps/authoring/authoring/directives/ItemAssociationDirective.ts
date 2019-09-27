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

ItemAssociationDirective.$inject = ['renditions', 'notify'];
export function ItemAssociationDirective(renditions, notify) {
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

            if (!elem.hasClass('no-drop-zone') && scope.editable) {
                // it should prevent default as long as this is valid image
                elem.on('dragover', (event) => {
                    if (isAllowedMediaType(scope, event)) {
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
                    const externalItemsCount = Object.values(event.originalEvent.dataTransfer.files || []).length;

                    if (externalItemsCount > 1) {
                        notify.error(
                            gettext('Select at most 1 file to upload.'),
                        );
                        removeDragOverClass();
                        return false;
                    }
                    if (isAllowedMediaType(scope, event)) {
                        removeDragOverClass();
                        event.preventDefault();
                        event.stopPropagation();
                        _ctrl.initializeUploadOnDrop(scope, event);
                        scope.$apply();
                    } else {
                        const allowedTypeNames = getAllowedTypeNames(scope);
                        const message = gettext('Only the following media item types are allowed: ');

                        notify.error(message + allowedTypeNames);
                        removeDragOverClass();
                        return false;
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

export function isAllowedMediaType(scope, event) {
    const {allowAudio, allowPicture, allowVideo} = scope;
    const VALID_MEDIA_TYPES = ['Files'];

    if (allowAudio) {
        VALID_MEDIA_TYPES.push('application/superdesk.item.audio');
    }
    if (allowPicture) {
        VALID_MEDIA_TYPES.push('application/superdesk.item.picture');
        VALID_MEDIA_TYPES.push('application/superdesk.item.graphic');
    }
    if (allowVideo) {
        VALID_MEDIA_TYPES.push('application/superdesk.item.video');
    }

    const mediaType = getSuperdeskType(event);
    let isValidMedia = VALID_MEDIA_TYPES.includes(mediaType);
    const dataTransfer = event.originalEvent.dataTransfer;

    if (isValidMedia && mediaType === 'Files' && dataTransfer.files) {
        // checks if files dropped from external folder are valid or not
        const isValidFileType = Object.values(dataTransfer.files).every(
            (file: File) => file.type.startsWith('audio/') && allowAudio === true
                || file.type.startsWith('image/') && allowPicture === true
                || file.type.startsWith('video/') && allowVideo === true);

        if (!isValidFileType) {
            return false;
        }
    }
    return isValidMedia;
}

export function getAllowedTypeNames(scope) {
    return [
        (scope.allowPicture === true ? gettext('image') : ''),
        (scope.allowVideo === true ? gettext('video') : ''),
        (scope.allowAudio === true ? gettext('audio') : ''),
    ].filter(Boolean).join(', ');
}
