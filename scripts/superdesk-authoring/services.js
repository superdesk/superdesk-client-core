(function() {
'use strict';

angular.module('superdesk.authoring').service('renditions', RenditionsService);

RenditionsService.$inject = ['metadata', '$q', 'api', 'superdesk', 'lodash'];
function RenditionsService(metadata, $q, api, superdesk, _) {
    var self = this;
    this.ingest = function(item) {
        var performRenditions = $q.when(item);
        // ingest picture if it comes from an external source (create renditions)
        if (item._type && item._type === 'externalsource') {
            performRenditions = superdesk.intent('list', 'externalsource',  {item: item}).then(function(item) {
                return api.find('archive', item._id);
            });
        }
        return performRenditions;
    };
    this.get = function() {
        return metadata.initialize().then(function() {
            self.renditions = metadata.values.crop_sizes;
            return self.renditions;
        });
    };
    this.crop = function(picture) {
        var poi = {x: 0.5, y: 0.5};
        return self.get().then(function(renditions) {
            // we want to crop only renditions that change the ratio
            renditions = _.filter(renditions, function(rendition) {
                return angular.isDefined(rendition.ratio);
            });
            return superdesk.intent('edit', 'crop', {
                item: picture,
                renditions: renditions,
                poi: picture.poi || poi,
                showMetadataEditor: true
            })
            .then(function(result) {
                var renditionNames = [];
                var savingImagePromises = [];
                angular.forEach(result.cropData, function(croppingData, renditionName) {
                    // if croppingData are defined
                    if (angular.isDefined(croppingData.CropLeft) && !isNaN(croppingData.CropLeft)) {
                        renditionNames.push(renditionName);
                    }
                });
                // perform the request to make the cropped images
                angular.forEach(renditionNames, function(renditionName) {
                    savingImagePromises.push(
                        api.save('picture_crop', {item: picture, crop: result.cropData[renditionName]})
                    );
                });
                return $q.all(savingImagePromises)
                // return the cropped images
                .then(function(croppedImages) {
                    // save created images in "association" property
                    croppedImages.forEach(function(image, index) {
                        var url = image.href;
                        // update association
                        picture.poi = result.poi;
                        // update association renditions
                        picture.renditions[renditionNames[index]] = angular.extend(
                            image.crop,
                            {
                                href: url,
                                width: image.width,
                                height: image.height,
                                media: image._id,
                                mimetype: image.item.mimetype
                            }
                        );
                    });
                    return picture;
                });
            });
        });
    };
}

})();
