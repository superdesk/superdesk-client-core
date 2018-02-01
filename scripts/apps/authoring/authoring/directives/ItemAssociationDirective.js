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

ItemAssociationDirective.$inject = ['superdesk', 'renditions', 'config', 'authoring', '$q',
    'api', 'notify', 'gettext', 'send', 'mediaIdGenerator'];
export function ItemAssociationDirective(superdesk, renditions, config, authoring, $q, api, notify, gettext,
    send, mediaIdGenerator) {
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
        templateUrl: 'scripts/apps/authoring/views/item-association.html',
        link: function(scope, elem) {
            var MEDIA_TYPES = [];

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

            /**
             * @ngdoc method
             * @name sdItemAssociation#getItem
             * @private
             * @description Get superdesk item from event.
             *              If not externalsource then fetch for archive collection not all fields
             *              are available due to projections.
             * @param {Event} event
             * @param {string} dataType
             * @return {Object}
             */
            function getItem(event, dataType) {
                let item = angular.fromJson(event.originalEvent.dataTransfer.getData(dataType));

                if (item._type !== 'externalsource') {
                    if (item._type === 'ingest') {
                        return send.one(item);
                    }

                    return api.find(item._type, item._id);
                }

                return $q.when(item);
            }

            /**
             * Get superdesk type for data transfer if any
             *
             * @param {Event} event
             * @return {string}
             */
            function getSuperdeskType(event) {
                return event.originalEvent.dataTransfer.types
                    .find((name) => name.indexOf('application/superdesk') === 0 || name === 'Files');
            }

            /**
             * @ngdoc method
             * @name sdItemAssociation#uploadAndCropImages
             * @private
             * @description Opens the file upload dialog. If files contains an array of files populates
             *              the dialog with the given files. Opens the crop dialog for each uploaded file.
             * @param {Array} files
             */
            function uploadAndCropImages(files) {
                let uploadData = {
                    files: files,
                    uniqueUpload: scope.maxUploads === undefined || scope.maxUploads === 1,
                    maxUploads: scope.maxUploads,
                    allowPicture: scope.allowPicture,
                    allowVideo: scope.allowVideo,
                    allowAudio: scope.allowAudio
                };

                superdesk.intent('upload', 'media', uploadData).then((images) => {
                    // open the view to edit the PoI and the cropping areas
                    if (images) {
                        scope.$applyAsync(() => {
                            var [rootField, index] = mediaIdGenerator.getFieldParts(scope.rel);
                            var imagesWithIds = [];

                            function editNextFile() {
                                if (imagesWithIds.length > 0) {
                                    var imageWithId = imagesWithIds.shift();

                                    scope.edit(imageWithId.image, imageWithId.id, editNextFile);
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
            }

            let dragOverClass = 'dragover';

            // it should prevent default as long as this is valid image
            elem.on('dragover', (event) => {
                if (MEDIA_TYPES.indexOf(getSuperdeskType(event)) > -1) {
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

                if (getSuperdeskType(event) === 'Files') {
                    if (scope.isMediaEditable()) {
                        const files = event.originalEvent.dataTransfer.files;

                        uploadAndCropImages(files);
                    }
                    return;
                }

                getItem(event, getSuperdeskType(event))
                    .then((item) => {
                        if (!scope.editable) {
                            return;
                        }

                        if (item.lock_user) {
                            notify.error(gettext('Item is locked. Cannot associate media item.'));
                            return;
                        }

                        if (scope.isMediaEditable()) {
                            scope.loading = true;
                            renditions.ingest(item)
                                .then(scope.edit)
                                .finally(() => {
                                    scope.loading = false;
                                });
                        } else {
                            // update association in an item even if editing of metadata and crop not allowed.
                            updateItemAssociation(item);
                        }
                    });
            });


            /**
             * @ngdoc method
             * @name sdItemAssociation#updateItemAssociation
             * @private
             * @description If the item is not published then it saves the changes otherwise calls autosave.
             * @param {Object} updated Item to be edited
             * @param {String} custom association identifier
             * @param {Function} callback to call after save
             */
            function updateItemAssociation(updated, customRel, callback = null) {
                let data = {};

                if (customRel) {
                    scope.rel = customRel;
                }
                data[scope.rel] = updated;
                scope.item.associations = angular.extend({}, scope.item.associations, data);
                if (!authoring.isPublished(scope.item) && updated) {
                    var promise = scope.save();

                    if (callback) {
                        return promise.then(callback);
                    }
                    return promise;
                }

                scope.onchange({item: scope.item, data: data});
            }

            // init associated item for preview
            scope.$watch('item.associations[rel]', (related) => {
                scope.related = related;
            });

            renditions.get();

            /**
             * @ngdoc method
             * @name sdItemAssociation#edit
             * @public
             * @description Opens the item for edit.
             * @param {Object} item Item to be edited
             */
            scope.edit = function(item, customRel, callback = null) {
                if (!scope.isMediaEditable()) {
                    return;
                }

                if (item.renditions && item.renditions.original && scope.isImage(item.renditions.original)) {
                    scope.loading = true;
                    return renditions.crop(item, true, scope.editable, true)
                        .then((rendition) => {
                            updateItemAssociation(rendition, customRel, callback);
                        })
                        .finally(() => {
                            scope.loading = false;
                        });
                }

                updateItemAssociation(item, customRel, callback);
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#isVideo
             * @public
             * @description Check if the rendition is video or not.
             * @param {Object} rendition Rendition of the item.
             */
            scope.isVideo = function(rendition) {
                if (_.startsWith(rendition.mimetype, 'video')) {
                    return true;
                }

                return _.some(['.mp4', '.webm', '.ogv', '.ogg'], (ext) => _.endsWith(rendition.href, ext));
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#isAudio
             * @public
             * @description Check if the rendition is audio or not.
             * @param {Object} rendition Rendition of the item.
             */
            scope.isAudio = function(rendition) {
                if (_.startsWith(rendition.mimetype, 'audio')) {
                    return true;
                }

                return _.some(
                    ['.mp3', '.3gp', '.wav', '.ogg', 'wma', 'aa', 'aiff'],
                    (ext) => _.endsWith(rendition.href, ext)
                );
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#isImage
             * @public
             * @description Check if the rendition is image or not.
             * @param {Object} rendition Rendition of the item.
             */
            scope.isImage = function(rendition) {
                return _.startsWith(rendition.mimetype, 'image');
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#isMediaEditable
             * @public
             * @description Check if featured media can be edited or not. i.e. metadata/crops can be changed or not.
             */
            scope.isMediaEditable = function() {
                return !(config.features && 'editFeaturedImage' in config.features
                    && !config.features.editFeaturedImage);
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#remove
             * @public
             * @description Remove the associations
             */
            scope.remove = function(item) {
                updateItemAssociation(null);
            };

            /**
             * @ngdoc method
             * @name sdItemAssociation#upload
             * @public
             * @description Upload media.
             */
            scope.upload = function() {
                if (scope.editable) {
                    uploadAndCropImages();
                }
            };
        }
    };
}
