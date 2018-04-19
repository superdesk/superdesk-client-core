/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name renditions
 *
 * @requires metadata
 * @requires $q
 * @requires api
 * @requires superdesk
 * @requires lodash
 *
 * @description Renditions Service allows the user to generate different crops.
 */
RenditionsService.$inject = ['metadata', '$q', 'api', 'superdesk', 'lodash'];
export function RenditionsService(metadata, $q, api, superdesk, _) {
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
            performRenditions = superdesk.intent('list', 'externalsource', {item: item}, 'externalsource')
                .then((item) => api.find('archive', item._id));
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
     *  @param {Object} picture Picture item
     *  @param {boolean} isNew to indicate if picture is new or not
     *  @param {boolean} editable to indicate if picture is editable or not
     *  @param {boolean} isAssociated to indicate if picture is isAssociated or not
     *  @return {promise} returns the modified picture item
     */
    this.crop = function(picture, isNew = true, editable = true, isAssociated = false) {
        let clonedPicture = _.extend({}, picture);

        clonedPicture.renditions = _.cloneDeep(clonedPicture.renditions);

        return self.get().then((renditions) => {
            // we want to crop only renditions that change the ratio
            let withRatio = _.filter(renditions, (rendition) => angular.isDefined(rendition.ratio));

            if (!withRatio.length) {
                withRatio = self.renditions;
            }

            return superdesk.intent('edit', 'crop', {
                item: clonedPicture,
                renditions: withRatio,
                poi: clonedPicture.poi || {x: 0.5, y: 0.5},
                showAoISelectionButton: true,
                showMetadataEditor: true,
                isNew: isNew,
                isAssociated: isAssociated,
                editable: editable,
            })
                .then((result) => {
                    let renditionNames = [];
                    let savingImagePromises = [];

                    // applying metadata changes
                    angular.forEach(result.cropData, (croppingData, renditionName) => {
                    // if there a change in the crop co-ordinates
                        const keys = ['CropLeft', 'CropTop', 'CropBottom', 'CropRight'];

                        let canAdd = !keys.every((key) => {
                            let sameCoords = angular.isDefined(picture.renditions[renditionName]) &&
                            picture.renditions[renditionName][key] === croppingData[key];

                            return sameCoords;
                        });

                        if (canAdd) {
                            renditionNames.push(renditionName);
                        }
                    });

                    // perform the request to make the cropped images
                    renditionNames.forEach((renditionName) => {
                        if (picture.renditions[renditionName] !== result.cropData[renditionName]) {
                            savingImagePromises.push(
                                api.save('picture_crop', {item: clonedPicture, crop: result.cropData[renditionName]})
                            );
                        }
                    });

                    return $q.all(savingImagePromises)
                    // return the cropped images
                        .then((croppedImages) => {
                            // save created images in "association" property
                            croppedImages.forEach((image, index) => {
                                let url = image.href;

                                // update association renditions
                                result.metadata.renditions[renditionNames[index]] = angular.extend(
                                    image.crop,
                                    {
                                        href: url,
                                        width: image.width,
                                        height: image.height,
                                        media: image._id,
                                        mimetype: image.item.mimetype,
                                    }
                                );
                            });

                            // apply the metadata changes
                            angular.extend(picture, result.metadata);
                            return picture;
                        });
                });
        });
    };
}
