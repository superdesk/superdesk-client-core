(function() {
'use strict';

angular.module('superdesk.authoring').service('cropPicture', CropPictureService);
CropPictureService.$inject = ['$q', 'renditions', 'api', 'superdesk'];

function CropPictureService($q, renditionsService, api, superdesk) {
    this.crop = function(picture) {
        var poi = {x: 0.5, y: 0.5};
        return renditionsService.get().then(function(renditions) {
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
