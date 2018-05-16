/* global _ */

import 'owl.carousel';
import * as ctrl from '../controllers';
import {waitForImagesToLoad, waitForAudioAndVideoToLoadMetadata} from 'core/helpers/waitForMediaToBeReady';


const carouselContainerSelector = '.sd-media-carousel__content';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemCarousel
 *
 * @requires $timeout
 */
ItemCarouselDirective.$inject = ['$timeout'];
export function ItemCarouselDirective($timeout) {
    return {
        scope: {
            items: '=',
            item: '=',
            editable: '<',
            allowPicture: '<',
            allowVideo: '<',
            allowAudio: '<',
            save: '&',
            onchange: '&',
            maxUploads: '=',
        },
        transclude: true,
        templateUrl: 'scripts/apps/authoring/views/item-carousel.html',
        controller: ctrl.AssociationController,
        controllerAs: 'associations',
        link: function(scope, elem, attr, ctrl) {
            let carousel;
            let previousItemsString;

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
            scope.navNext = () => carousel.trigger('next.owl.carousel');
            scope.navPrev = () => carousel.trigger('prev.owl.carousel');

            /*
             * Function for triggering thumbnail navigation
             */
            scope.goTo = (index) => carousel.trigger('to.owl.carousel', [index]);

            elem.on('dragover', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });

            elem.on('drop dragdrop', (event) => {
                event.preventDefault();
                event.stopPropagation();

                ctrl.initializeUploadOnDrop(scope, event);
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
            }

            scope.$on('$destroy', () => {
                elem.off('drop dragdrop dragover');
            });
        },
    };
}
