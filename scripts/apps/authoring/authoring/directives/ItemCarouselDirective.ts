import 'owl.carousel';
import _ from 'lodash';
import * as ctrl from '../controllers';
import {waitForMediaToLoad} from 'core/helpers/waitForMediaToBeReady';
import {getSuperdeskType} from 'core/utils';
import {gettext} from 'core/utils';
import {addInternalEventListener} from 'core/internal-events';
import {isAllowedMediaType, getAllowedTypeNames} from './ItemAssociationDirective';
import {IArticle} from 'superdesk-api';

const carouselContainerSelector = '.sd-media-carousel__content';

interface IScope extends ng.IScope {
    allowAudio: any;
    allowPicture: any;
    allowVideo: any;
    carouselItems: any;
    currentIndex: number;
    editable: any;
    field: any;
    item: any;
    items: any;
    maxUploads: any;
    rel: any;
    goTo(index: any): void;
    navNext(): void;
    navPrev(): void;
    onchange(): void;
    remove(item: any): void;
    upload(): void;
}

function getItemsCount(items: Array<any>): number {
    return items
        .filter((_item) => _item[_item.fieldId] != null)
        .length;
}

function isOrderChanged(items: Array<any>, prevItems: Array<any>): boolean {
    return !!items.filter((_item, index) => {
        const fieldId = _item.fieldId;

        return items[index][fieldId] != null && prevItems[index][fieldId] != null
        && items[index][fieldId].order !== prevItems[index][fieldId].order;
    }).length;
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemCarousel
 */
ItemCarouselDirective.$inject = ['notify'];
export function ItemCarouselDirective(notify) {
    return {
        scope: {
            allowAudio: '<',
            allowPicture: '<',
            allowVideo: '<',
            editable: '<',
            field: '=',
            item: '=',
            items: '=',
            maxUploads: '=',
            onchange: '&',
            save: '&',
            tabindex: '<',
        },
        transclude: true,
        templateUrl: 'scripts/apps/authoring/views/item-carousel.html',
        controller: ctrl.AssociationController,
        controllerAs: 'associations',
        link: function(scope: IScope, elem, attr, controller) {
            let carousel;
            let previousItems: Array<any>;

            scope.currentIndex = 0;

            /*
             * Initialize carousel after all content is loaded
             * otherwise carousel height is messed up
             */
            scope.$watchCollection('items', (items: Array<any>) => {
                // Don't execute if there are no items or their length is same as before and their order is unchanged
                if (items == null || previousItems && getItemsCount(items) === getItemsCount(previousItems)
                    && !isOrderChanged(items, previousItems)) {
                    return false;
                }

                previousItems = _.cloneDeep(items);
                let field = _.find(items, (item) => !item[item.fieldId]);

                scope.rel = field ? field.fieldId : null;

                scope.carouselItems = _.sortBy(_.filter(items, (item: any) => item[item.fieldId]),
                    [(item: any) => item[item.fieldId].order]);

                scope.$applyAsync(() => {
                    // waiting for angular to render items

                    if (carousel) {
                        carousel.trigger('destroy.owl.carousel');
                    }

                    const carouselImages: Array<HTMLImageElement> = Array.from(
                        elem.get(0).querySelectorAll(`${carouselContainerSelector} img`),
                    );
                    const carouselAudiosAndVideos: Array<HTMLAudioElement | HTMLVideoElement> = Array.from(
                        elem.get(0).querySelectorAll(
                            `${carouselContainerSelector} video, ${carouselContainerSelector} audio`,
                        ),
                    );

                    if (items.length < 1 || (carouselImages.length + carouselAudiosAndVideos.length < 1)) {
                        return;
                    }

                    const mediaItems: Array<HTMLAudioElement | HTMLVideoElement | HTMLImageElement> =
                        [].concat(carouselImages).concat(carouselAudiosAndVideos);

                    waitForMediaToLoad(mediaItems).then(initCarousel);
                });
            });

            /*
             * Initialize carousel navigation
             */
            scope.navNext = () => {
                if (scope.currentIndex < scope.carouselItems.length - 1) {
                    carousel.trigger('next.owl.carousel');
                    scope.currentIndex++;
                }
            };

            scope.navPrev = () => {
                if (scope.currentIndex > 0) {
                    carousel.trigger('prev.owl.carousel');
                    scope.currentIndex--;
                }
            };

            /*
             * Function for triggering thumbnail navigation
             */
            scope.goTo = (index) => {
                scope.currentIndex = index;
                carousel.trigger('to.owl.carousel', [index]);
            };

            function canAddMediaItems(internalIds: Array<IArticle['_id']>, externalItemsCount: number = 0): boolean {
                const mediaItemsForCurrentField = Object.keys(scope.item.associations || {})
                    .filter((key) => key.startsWith(scope.field._id) && scope.item.associations[key] != null)
                    .map((key) => scope.item.associations[key]);

                const currentUploads = mediaItemsForCurrentField.length;

                const itemAlreadyAddedAsMediaGallery = mediaItemsForCurrentField.some(
                    (mediaItem) => internalIds.includes(mediaItem._id),
                );

                if (currentUploads >= scope.maxUploads) {
                    notify.error(
                        gettext(
                            'Media item was not added, because the field reached the limit of allowed media items.',
                        ),
                    );
                    return false;
                }

                // check files from external folder does not exceed the maxUploads limit
                if (currentUploads + externalItemsCount > scope.maxUploads) {
                    notify.error(
                        gettext(
                            'Select at most {{maxUploads}} files to upload.',
                            {maxUploads: scope.maxUploads - currentUploads},
                        ),
                    );
                    return false;
                }

                if (itemAlreadyAddedAsMediaGallery) {
                    notify.error('This item is already added as media gallery.');
                    return false;
                }

                return true;
            }

            if (!elem.hasClass('no-drop-zone') && scope.editable) {
                elem.on('dragover', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                });

                elem.on('drop dragdrop', (event) => {
                    if (!scope.editable) {
                        return;
                    }
                    const type = getSuperdeskType(event);

                    event.preventDefault();
                    event.stopPropagation();

                    if (isAllowedMediaType(scope, event)) {
                        const itemStr = event.originalEvent.dataTransfer.getData(type);
                        const internalIds = typeof itemStr === 'string' && itemStr.length > 0
                            ? [JSON.parse(itemStr)._id]
                            : [];
                        const externalItemsCount = Object.values(event.originalEvent.dataTransfer.files || []).length;

                        if (canAddMediaItems(internalIds, externalItemsCount)) {
                            // add a new item at the last position in the carousel
                            scope.currentIndex = scope.carouselItems != null ? scope.carouselItems.length : 0;
                            controller.initializeUploadOnDrop(scope, event);
                        }
                    } else {
                        const allowedTypeNames = getAllowedTypeNames(scope);
                        const message = gettext('Only the following content item types are allowed: ');

                        notify.error(message + allowedTypeNames);
                    }
                });
            }

            /**
             * @ngdoc method
             * @name sdItemAssociation#upload
             * @public
             * @description Upload media.
             */
            scope.upload = function() {
                if (scope.editable) {
                    controller.uploadAndCropImages(scope);
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
                controller.updateItemAssociation(scope, null, item.fieldId).then(reorderMediaItems);
                // if we deleted the last item from the carousel then reduce the currentIndex by one so that
                // gallery does not disappear
                if (scope.currentIndex && scope.currentIndex === scope.carouselItems.length - 1) {
                    scope.currentIndex -= 1;
                }
            };

            function reorderMediaItems() {
                scope.carouselItems.forEach((item, index) => {
                    let data = {};

                    // assign index as new order since carouselItems are sorted by order
                    item[item.fieldId].order = index;
                    data[item.fieldId] = item[item.fieldId];
                    scope.item.associations = angular.extend({}, scope.item.associations, data);
                });
                scope.onchange();
            }

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
                                .index(ui.item),
                        );
                    },
                    stop: (event, ui) => {
                        if (updated) {
                            updated = false;

                            let start = ui.item.data('start_index'),
                                end = ui.item.parent().find('.sd-media-carousel__thumb-strip-item')
                                    .index(ui.item);

                            scope.carouselItems.splice(end, 0, scope.carouselItems.splice(start, 1)[0]);
                            reorderMediaItems();
                        }
                    },
                    update: function(event, ui) {
                        updated = true;
                    },
                });

                if (scope.currentIndex) {
                    carousel.trigger('to.owl.carousel', [scope.currentIndex]);
                }
            }

            const removeAddImageEventListener = addInternalEventListener('addImage', (event) => {
                const {field, image} = event.detail;

                if (scope.field._id === field && canAddMediaItems([image._id])) {
                    controller.addAssociation(scope, image);
                }
            });

            scope.$on('$destroy', () => {
                elem.off('drop dragdrop dragover');
                removeAddImageEventListener();
            });
        },
    };
}
