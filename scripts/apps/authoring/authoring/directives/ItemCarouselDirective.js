/* global _ */

import 'owl.carousel';
import * as ctrl from '../controllers';
import {waitForImagesToLoad, waitForAudioAndVideoToLoadMetadata} from 'core/helpers/waitForMediaToBeReady';
import {getSuperdeskType} from 'core/utils';
import {gettext} from 'core/utils';


const carouselContainerSelector = '.sd-media-carousel__content';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemCarousel
 *
 * @requires $timeout
 */
ItemCarouselDirective.$inject = ['$timeout', 'notify'];
export function ItemCarouselDirective($timeout, notify) {
    return {
        scope: {
            items: '=',
            item: '=',
            tabindex: '<',
            editable: '<',
            allowPicture: '<',
            allowVideo: '<',
            allowAudio: '<',
            save: '&',
            onchange: '&',
            maxUploads: '=',
            field: '=',
        },
        transclude: true,
        templateUrl: 'scripts/apps/authoring/views/item-carousel.html',
        controller: ctrl.AssociationController,
        controllerAs: 'associations',
        link: function(scope, elem, attr, ctrl) {
            let carousel;
            let previousItemsString;
            const allowed = {picture: scope.allowPicture, video: scope.allowVideo, audio: scope.allowAudio};
            const ALLOWED_TYPES = Object.keys(allowed)
                .filter((key) => allowed[key] === true)
                .map((key) => 'application/superdesk.item.' + key);


            /*
             * Initialize carousel after all content is loaded
             * otherwise carousel height is messed up
             */
            scope.$watch('items', (items) => {
                const itemsString = angular.toJson(items);

                // Don't execute if there are no items or they are the same as before
                if (!items || previousItemsString === itemsString) {
                    return false;
                }

                scope.navCounter = 1;
                previousItemsString = itemsString;

                let field = _.find(items, (item) => !item[item.fieldId]);

                scope.rel = field ? field.fieldId : null;

                scope.carouselItems = _.sortBy(_.filter(items, (item) => item[item.fieldId]),
                    [(item) => item[item.fieldId].order]);


                scope.$applyAsync(() => {
                    // waiting for angular to render items

                    if (carousel) {
                        carousel.trigger('destroy.owl.carousel');
                    }

                    const carouselImages = Array.from(elem.get(0).querySelectorAll(`${carouselContainerSelector} img`));
                    const carouselAudiosAndVideos = Array.from(
                        elem.get(0).querySelectorAll(
                            `${carouselContainerSelector} video, ${carouselContainerSelector} audio`
                        )
                    );

                    if (items.length < 1 || (carouselImages.length + carouselAudiosAndVideos.length < 1)) {
                        return;
                    }

                    Promise.all([
                        waitForImagesToLoad(carouselImages),
                        waitForAudioAndVideoToLoadMetadata(carouselAudiosAndVideos),
                    ]).then(initCarousel);
                });
            });
            /*
             * Initialize carousel navigation
             */
            scope.navNext = () => {
                if (scope.navCounter < scope.carouselItems.length) {
                    carousel.trigger('next.owl.carousel');
                    scope.navCounter++;
                }
            };

            scope.navPrev = () => {
                if (scope.navCounter > 1) {
                    carousel.trigger('prev.owl.carousel');
                    scope.navCounter--;
                }
            };

            /*
             * Function for triggering thumbnail navigation
             */
            scope.goTo = (index) => {
                scope.crtIndex = index;
                scope.navCounter = index + 1;
                carousel.trigger('to.owl.carousel', [index]);
            };

            elem.on('dragover', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });

            elem.on('drop dragdrop', (event) => {
                const type = getSuperdeskType(event);

                event.preventDefault();
                event.stopPropagation();

                if (ALLOWED_TYPES.includes(type) || type === 'Files') {
                    const mediaItemsForCurrentField = Object.keys(scope.item.associations || {})
                        .filter((key) => key.startsWith(scope.field._id) && scope.item.associations[key] != null)
                        .map((key) => scope.item.associations[key]);

                    const currentUploads = mediaItemsForCurrentField.length;

                    const item = angular.fromJson(event.originalEvent.dataTransfer.getData(type));


                    const itemAlreadyAddedAsMediaGallery = mediaItemsForCurrentField.some(
                        (mediaItem) => mediaItem._id === item._id
                    );

                    if (currentUploads >= scope.maxUploads) {
                        notify.error(
                            gettext(
                                'Media item was not added, because the field reached the limit of allowed media items.'
                            )
                        );
                        return;
                    }

                    if (itemAlreadyAddedAsMediaGallery) {
                        notify.error('This item is already added as media gallery.');
                        return;
                    }

                    ctrl.initializeUploadOnDrop(scope, event);
                } else {
                    const allowedTypeNames = [
                        (scope.allowPicture === true ? gettext('image') : ''),
                        (scope.allowVideo === true ? gettext('video') : ''),
                        (scope.allowAudio === true ? gettext('audio') : ''),
                    ].filter(Boolean).join(', ');
                    const message = gettext('Only the following content item types are allowed: ');

                    notify.error(message + allowedTypeNames);
                }
            });

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

            /**
             * @ngdoc method
             * @name sdItemAssociation#remove
             * @public
             * @description Remove the associations
             * @param {Object} item Item object
             */
            scope.remove = function(item) {
                ctrl.updateItemAssociation(scope, null, item.fieldId);
            };

            /**
             * @ngdoc method
             * @name sdItemCarouselDirective#initCarousel
             * @private
             * @description Initialize carousel on page
             */
            function initCarousel() {
                let updated = false;

                carousel = elem.find(carouselContainerSelector).owlCarousel({
                    items: 1,
                    autoHeight: true,
                    mouseDrag: false, // disable mouse & touch drag to allow contenteditable
                    touchDrag: false,
                });

                // Initialize sortable function for thumbnails
                elem.find('.sd-media-carousel__thumb-strip').sortable({
                    items: '.sd-media-carousel__thumb-strip-item',
                    start: (event, ui) => {
                        ui.item.data('start_index',
                            ui.item.parent().find('.sd-media-carousel__thumb-strip-item')
                                .index(ui.item)
                        );
                    },
                    stop: (event, ui) => {
                        if (updated) {
                            updated = false;

                            let start = ui.item.data('start_index'),
                                end = ui.item.parent().find('.sd-media-carousel__thumb-strip-item')
                                    .index(ui.item);

                            scope.carouselItems.splice(end, 0, scope.carouselItems.splice(start, 1)[0]);

                            angular.forEach(scope.carouselItems, (item) => {
                                let data = {};

                                item[item.fieldId].order = scope.carouselItems.indexOf(item);
                                data[item.fieldId] = item[item.fieldId];
                                scope.item.associations = angular.extend({}, scope.item.associations, data);
                            });

                            scope.onchange();
                        }
                    },
                    update: function(event, ui) {
                        updated = true;
                    },
                });

                if (scope.crtIndex) {
                    carousel.trigger('to.owl.carousel', [scope.crtIndex]);
                }
            }

            scope.$on('$destroy', () => {
                elem.off('drop dragdrop dragover');
            });
        },
    };
}
