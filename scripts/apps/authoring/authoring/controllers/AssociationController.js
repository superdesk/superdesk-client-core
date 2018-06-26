/* global _ */


/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name AssociationController
 *
 * @requires $scope
 *
 * @description Controller for handling adding/uploading images to association fields
 */
AssociationController.$inject = ['config', 'send', 'api', '$q', 'superdesk',
    'mediaIdGenerator', 'authoring', 'renditions', 'notify'];
export function AssociationController(config, send, api, $q, superdesk,
    mediaIdGenerator, authoring, renditions, notify) {
    const self = this;

    /**
     * @ngdoc method
     * @name AssociationController#isMediaEditable
     * @public
     * @description Check if featured media can be edited or not. i.e. metadata/crops can be changed or not.
     */
    this.isMediaEditable = function() {
        return !(config.features && 'editFeaturedImage' in config.features
                && !config.features.editFeaturedImage);
    };

    /**
     * @ngdoc method
     * @name AssociationController#isImage
     * @public
     * @description Check if the rendition is image or not.
     * @param {Object} rendition Rendition of the item.
     */
    this.isImage = function(rendition) {
        return _.startsWith(rendition.mimetype, 'image');
    };

    /**
     * @ngdoc method
     * @name AssociationController#isVideo
     * @public
     * @description Check if the rendition is video or not.
     * @param {Object} rendition Rendition of the item.
     */
    this.isVideo = function(rendition) {
        if (_.startsWith(rendition.mimetype, 'video')) {
            return true;
        }

        return _.some(['.mp4', '.webm', '.ogv', '.ogg'], (ext) => _.endsWith(rendition.href, ext));
    };

    /**
     * @ngdoc method
     * @name AssociationController#isAudio
     * @public
     * @description Check if the rendition is audio or not.
     * @param {Object} rendition Rendition of the item.
     */
    this.isAudio = function(rendition) {
        if (_.startsWith(rendition.mimetype, 'audio')) {
            return true;
        }

        return _.some(
            ['.mp3', '.3gp', '.wav', '.ogg', 'wma', 'aa', 'aiff'],
            (ext) => _.endsWith(rendition.href, ext)
        );
    };

    /**
     * Get superdesk type for data transfer if any
     *
     * @param {Event} event
     * @return {string}
     */
    this.getSuperdeskType = function(event) {
        return event.originalEvent.dataTransfer.types
            .find((name) => name.indexOf('application/superdesk') === 0 || name === 'Files');
    };

    /**
     * @ngdoc method
     * @name AssociationController#getItem
     * @private
     * @description Get superdesk item from event.
     *              If not externalsource then fetch for archive collection not all fields
     *              are available due to projections.
     * @param {Event} event
     * @param {string} dataType
     * @return {Object}
     */
    this.getItem = function(event, dataType) {
        let item = angular.fromJson(event.originalEvent.dataTransfer.getData(dataType));

        if (item._type !== 'externalsource') {
            if (item._type === 'ingest') {
                return send.one(item);
            }

            return api.find(item._type, item._id);
        }

        return $q.when(item);
    };

    /**
     * @ngdoc method
     * @name AssociationController#uploadAndCropImages
     * @private
     * @description Opens the file upload dialog. If files contains an array of files populates
     *              the dialog with the given files. Opens the crop dialog for each uploaded file.
     * @param {Object} scope Directive scope
     * @param {Array} files
     */
    this.uploadAndCropImages = function(scope, files) {
        let uploadData = {
            files: files,
            uniqueUpload: scope.maxUploads === undefined || scope.maxUploads === 1,
            maxUploads: scope.maxUploads,
            allowPicture: scope.allowPicture,
            allowVideo: scope.allowVideo,
            allowAudio: scope.allowAudio,
        };

        superdesk.intent('upload', 'media', uploadData).then((images) => {
            // open the view to edit the point of interest and the cropping areas
            if (images) {
                scope.$applyAsync(() => {
                    var [rootField, index] = mediaIdGenerator.getFieldParts(scope.rel);
                    var imagesWithIds = [];

                    function editNextFile() {
                        if (imagesWithIds.length > 0) {
                            var imageWithId = imagesWithIds.shift();

                            self.edit(scope, imageWithId.image, {
                                customRel: imageWithId.id,
                                isNew: true,
                            }, editNextFile);
                        }
                    }

                    _.forEach(images, (image) => {
                        imagesWithIds.push({id: scope.rel, image: image});
                        scope.rel = mediaIdGenerator.getFieldVersionName(rootField, ++index);
                    });
                    editNextFile();
                });
            }
        });
    };

    /**
     * @ngdoc method
     * @name AssociationController#updateItemAssociation
     * @private
     * @description If the item is not published then it saves the changes otherwise calls autosave.
     * @param {Object} scope Directive scope
     * @param {Object} updated Item to be edited
     * @param {String} customRel association identifier
     * @param {Function} callback to call after save
     */
    this.updateItemAssociation = function(scope, updated, customRel, callback = null) {
        let data = {}, rel = customRel || scope.rel;

        data[rel] = updated;
        scope.item.associations = angular.extend({}, scope.item.associations, data);
        scope.rel = rel;
        if (!authoring.isPublished(scope.item) && updated) {
            var promise = scope.save();

            if (callback) {
                return promise.then(callback);
            }
            return promise;
        }

        scope.onchange({item: scope.item, data: data});
    };

    /**
     * @ngdoc method
     * @name AssociationController#edit
     * @public
     * @description Opens the item for edit.
     * @param {Object} scope Directive scope
     * @param {Object} item Item to be edited
     * @param {Object} options { isNew: Boolean, customRel: String }
     * @param {Function} callback Callback function
     */
    this.edit = function(scope, item, options = {}, callback = null) {
        if (!self.isMediaEditable()) {
            return;
        }

        const cropOptions = {
            isNew: 'isNew' in options ? options.isNew : false,
            editable: scope.editable,
            isAssociated: true,
            defaultTab: 'crop',
            showMetadata: true,
        }

        if (item.renditions && item.renditions.original && self.isImage(item.renditions.original)) {
            scope.loading = true;
            return renditions.crop(item, cropOptions)
                .then((rendition) => {
                    self.updateItemAssociation(scope, rendition, options.customRel, callback);
                })
                .finally(() => {
                    scope.loading = false;
                });
        }

        self.updateItemAssociation(scope, item, options.customRel, callback);
    };

    /**
     * @ngdoc method
     * @name AssociationController#initializeUploadOnDrop
     * @public
     * @description Initialize upload on drop in field
     * @param {Object} scope Directive scope
     * @param {Object} event Drop event
     */
    this.initializeUploadOnDrop = function(scope, event) {
        if (self.getSuperdeskType(event) === 'Files') {
            if (self.isMediaEditable()) {
                const files = event.originalEvent.dataTransfer.files;

                self.uploadAndCropImages(scope, files);
            }
            return;
        }

        self.getItem(event, self.getSuperdeskType(event)).then((item) => {
            if (!scope.editable) {
                return;
            }

            if (item.lock_user) {
                notify.error(gettext('Item is locked. Cannot associate media item.'));
                return;
            }

            if (self.isMediaEditable()) {
                scope.loading = true;
                renditions.ingest(item)
                    .then((item) => self.edit(scope, item))
                    .finally(() => {
                        scope.loading = false;
                    });
            } else {
                // update association in an item even if editing of metadata and crop not allowed.
                self.updateItemAssociation(scope, item);
            }
        });
    };
}
