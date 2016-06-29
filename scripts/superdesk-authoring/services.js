(function() {
'use strict';

angular.module('superdesk.authoring')
    .service('renditions', RenditionsService)
    .factory('history', HistoryFactory);

/**
 * Watches an expression to keep history of its states
 * and binds ctrl-z and ctrl-y to undo/redo its states
 */
HistoryFactory.$inject = ['History', '$window', '$timeout'];
function HistoryFactory(History, $window, $timeout) {
    var KeyOperations = {};
    KeyOperations['Z'.charCodeAt(0)] = History.undo;
    KeyOperations['Y'.charCodeAt(0)] = History.redo;

    return {
        watch: function(expression, scope) {
            var lastArchive;
            $timeout(function() {
                History.watch(expression, scope);
                lastArchive = new Date();
            }, 0, false);
            var onHistoryKeydown = function(event) {
                if (event.ctrlKey && KeyOperations[event.keyCode]) {
                    event.preventDefault();
                }
            };
            var onHistoryKeyup = function(event) {
                if (event.ctrlKey && KeyOperations[event.keyCode]) {
                    scope.$apply(function() {
                        KeyOperations[event.keyCode].bind(History)(expression, scope);
                    });
                }
            };
            angular.element($window).on('keydown', onHistoryKeydown);
            angular.element($window).on('keyup', onHistoryKeyup);
            scope.$on('History.archived', function(evt, data) {
                var newDate = new Date();
                if (lastArchive) {
                    if (Math.abs(newDate.getTime() - lastArchive.getTime()) < 1000) {
                        var history = History.history[scope.$id][expression];
                        if (history.length > 1) {
                            history.splice(history.length - 2, 1);
                            History.pointers[scope.$id][expression] -= 1;
                        }
                    }
                }
                lastArchive = newDate;
            });
            scope.$on('$destroy', function() {
                angular.element($window).unbind('keydown', onHistoryKeydown);
                angular.element($window).unbind('keyup', onHistoryKeyup);
                History.forget(scope, expression);
            });
        }
    };
}

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
                showAoISelectionButton: true,
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
