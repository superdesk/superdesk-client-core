import {isEmpty} from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name renditions
 * @description Renditions Service allows the user to generate different crops.
 */
RenditionsService.$inject = ['metadata', '$q', 'api', 'superdesk', 'lodash', 'notify'];
export function RenditionsService(metadata, $q, api, superdesk, _, notify) {
    var self = this;

    /**
     *  ngdoc method
     *  @name renditions#ingest
     *  @public
     *  @description Ingest the picture from external source.
     *
     *  @return {promise}
     */
    this.ingest = function(item) {
        var performRenditions = $q.when(item);
        // ingest picture if it comes from an external source (create renditions)

        if (item._type && item._type === 'externalsource') {
            performRenditions = superdesk.intent('list', 'externalsource', {item: item}, 'fetch-externalsource')
                .then((_item) => api.find('archive', _item._id));
        }
        return performRenditions;
    };

    /**
     *  ngdoc method
     *  @name renditions#get
     *  @public
     *  @description Get the crop sizes.
     *
     *  @return {promise} picture crops
     */
    this.get = function() {
        return metadata.initialize().then(() => {
            self.renditions = metadata.values.crop_sizes;
            return self.renditions;
        });
    };

    /**
     *  ngdoc method
     *  @name renditions#crop
     *  @public
     *  @description Crop the images.
     *
     *  @param {Object} item Media item
     *  @param {boolean} isNew to indicate if picture is new or not
     *  @param {boolean} editable to indicate if picture is editable or not
     *  @param {boolean} isAssociated to indicate if picture is isAssociated or not
     *  @return {promise} returns the modified picture item
     */
    this.crop = function(item, options): Promise<IArticle> {
        const clonedItem = _.extend({}, item);

        clonedItem.renditions = _.cloneDeep(clonedItem.renditions);

        return self.get().then((renditions) => {
            // we want to crop only renditions that change the ratio
            let withRatio = _.filter(renditions, (rendition) => angular.isDefined(rendition.ratio));

            if (!withRatio.length) {
                withRatio = self.renditions;
            }

            // Merge options with defauts
            const cropOptions = {
                isNew: true,
                isAssociated: false,
                editable: true,
                defaultTab: false,
                tabs: item.type === 'picture' ? ['view', 'image-edit', 'crop'] : ['view'],
                showMetadata: false,
                ...options,
            };

            return superdesk.intent('edit', 'crop', {
                item: clonedItem,
                renditions: withRatio,
                poi: clonedItem.poi,
                showAoISelectionButton: true,
                showMetadataEditor: true,
                ...cropOptions,
            })
                .then((result) => {
                    const renditionNames = [];
                    const savingImagePromises = [];

                    // applying metadata changes
                    angular.forEach(result.cropData, (croppingData, renditionName) => {
                        // if there a change in the crop co-ordinates
                        const keys = ['CropLeft', 'CropTop', 'CropBottom', 'CropRight'];

                        const canAdd = !keys.every((key) => {
                            const sameCoords = angular.isDefined(item.renditions[renditionName]) &&
                            item.renditions[renditionName][key] === croppingData[key];

                            return sameCoords;
                        });

                        if (canAdd) {
                            renditionNames.push(renditionName);
                        }
                    });

                    // perform the request to make the cropped images
                    renditionNames.forEach((renditionName) => {
                        if (!isEmpty(result.cropData[renditionName]) &&
                            item.renditions[renditionName] !== result.cropData[renditionName]) {
                            const rendition = renditions.find((_rendition) => renditionName === _rendition.name);
                            const crop = {
                                ...result.cropData[renditionName],
                                // it should send the size we need, not the one we have
                                width: rendition.width,
                                height: rendition.height,
                            };

                            savingImagePromises.push(
                                api.save('picture_crop', {item: clonedItem, crop: crop}),
                            );
                        }
                    });

                    return $q.all(savingImagePromises)
                        // return the cropped images
                        .then((croppedImages) => {
                            // save created images in "association" property
                            croppedImages.forEach((image, index) => {
                                const url = image.href;

                                // update association renditions
                                result.metadata.renditions[renditionNames[index]] = angular.extend(
                                    image.crop,
                                    {
                                        href: url,
                                        width: image.width,
                                        height: image.height,
                                        media: image._id,
                                        mimetype: image.item.mimetype,
                                    },
                                );
                            });

                            // apply the metadata changes
                            angular.extend(item, result.metadata);
                            return item;
                        })
                        .catch(() => {
                            notify.error(gettext('Failed to generate picture crops.'));
                        });
                }).catch((response) => {
                    // if new crops not generated continue with default one
                    // see https://github.com/superdesk/superdesk-client-core/pull/3117#discussion_r328440897
                    if (response != null && response.done === true) {
                        return item;
                    }
                });
        });
    };
}
