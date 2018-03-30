import * as ctrl from '../controllers';

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
            allowPicture: '<',
            allowVideo: '<',
            allowAudio: '<',
            onchange: '&',
            showTitle: '<',
            save: '&',
            maxUploads: '='
        },
        controller: ctrl.AssociationController,
        controllerAs: 'associations',
        templateUrl: 'scripts/apps/authoring/views/item-association.html',
        link: function(scope, elem, attr, ctrl) {
            const dragOverClass = 'dragover';

            let MEDIA_TYPES = [];

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
                    if (MEDIA_TYPES.indexOf(ctrl.getSuperdeskType(event)) > -1) {
                        event.preventDefault();
                        event.stopPropagation();
                        elem.find('figure').addClass(dragOverClass);
                    } else {
                        elem.find('figure').removeClass(dragOverClass);
                    }
                });

                elem.on('dragleave', () => {
                    elem.find('figure').removeClass(dragOverClass);
                });

                // update item associations on drop
                elem.on('drop dragdrop', (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    ctrl.initializeUploadOnDrop(scope, event);
                });
            }

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
                ctrl.updateItemAssociation(scope, null, item.fieldId);
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#upload
             * @public
             * @description Upload media.
             */
            scope.upload = function() {
                if (scope.editable) {
                    ctrl.uploadAndCropImages(scope);
                }
            };
        }
    };
}
