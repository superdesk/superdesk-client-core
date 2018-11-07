import EXIF from 'exif-js';
import _ from 'lodash';
import {getDataUrl} from 'scripts/core/upload/image-preview-directive';

/* eslint-disable complexity */

const getExifData = (file) => new Promise((resolve) => {
    EXIF.getData(file, function() {
        resolve(this);
    });
});

UploadController.$inject = [
    '$scope',
    '$q',
    'upload',
    'api',
    'archiveService',
    'session',
    'deployConfig',
    'multiImageEdit',
];
export function UploadController($scope, $q, upload, api, archiveService, session, deployConfig, multiImageEdit) {
    $scope.items = [];
    $scope.saving = false;
    $scope.failed = false;
    $scope.enableSave = false;
    $scope.currentUser = session.identity;
    $scope.uniqueUpload = $scope.locals && $scope.locals.data && $scope.locals.data.uniqueUpload === true;
    $scope.maxUploads = !$scope.uniqueUpload && $scope.locals && $scope.locals.data &&
        $scope.locals.data.maxUploads ? $scope.locals.data.maxUploads : undefined;
    $scope.allowPicture = !($scope.locals && $scope.locals.data && $scope.locals.data.allowPicture === false);
    $scope.allowVideo = !($scope.locals && $scope.locals.data && $scope.locals.data.allowVideo === false);
    $scope.allowAudio = !($scope.locals && $scope.locals.data && $scope.locals.data.allowAudio === false);
    $scope.validator = _.omit(deployConfig.getSync('validator_media_metadata'), ['archive_description']);

    let pseudoId = 0;
    const getPseudoId = () => ++pseudoId;

    const getItemByMetaId = (metaId) => $scope.items.find((item) => item.meta_id === metaId);

    $scope.onRemoveItem = (imageMeta) => {
        $scope.items = $scope.items.filter((item) => item.meta_id !== imageMeta._id);
        $scope.imagesMetadata = $scope.items.map((item) => item.meta);
    };

    $scope.imagesMetadata = [];
    $scope.getProgress = (imageMeta) => {
        const item = getItemByMetaId(imageMeta._id);

        if (item == null) {
            return 0;
        } else {
            return item.progress || 0;
        }
    };
    $scope.getImageUrl = (imageMeta) => {
        const item = getItemByMetaId(imageMeta._id);

        return item == null ? '' : item.imageDataUrl;
    };
    $scope.invokeImagesInput = () => {
        document.querySelector('#images-input').click();
    };

    $scope.isDragging = false;

    $scope.drag = ($isDragging, $class, $event) => {
        $scope.isDragging = $isDragging;
        $scope.$apply();
    };

    $scope.handleImageMetadataEdit = (editedMetadataItems) => {
        editedMetadataItems.forEach((metaItem) => {
            const item = $scope.items.find((i) => i.meta_id === metaItem._id);

            if (item != null) {
                item.meta = metaItem;

                // the item is not created yet, so has no real id
                // it only has local pseudo-id for multi metadata editing to work
                delete item.meta._id;
            }
        });

        return $scope.save();
    };

    var uploadFile = function(item) {
        var handleError = function(reason) {
            item.model = false;
            $scope.failed = true;
            return $q.reject(reason);
        };

        return item.upload || api.archive.getUrl()
            .then((url) => {
                item.upload = upload.start({
                    method: 'POST',
                    url: url,
                    data: {media: item.file},
                    headers: api.archive.getHeaders(),
                });
                item.upload.then((response) => {
                    if (response.data._issues) {
                        return handleError(response);
                    }

                    item.progress = 100;

                    item.model = response.data;
                    return item;
                }, handleError, (progress) => {
                    // limit progress to 90% and set 100 only after request is done
                    item.progress = Math.min(Math.round(progress.loaded / progress.total * 100.0), 90);
                });

                return item.upload;
            });
    };

    var checkFail = function() {
        $scope.failed = _.some($scope.items, {model: false});
    };

    var validateFields = function() {
        $scope.errorMessage = null;
        if (!_.isEmpty($scope.items)) {
            _.each($scope.items, (item) => {
                _.each(Object.keys($scope.validator), (key) => {
                    if ($scope.validator[key].required && (_.isNil(item.meta[key]) || _.isEmpty(item.meta[key]))) {
                        $scope.errorMessage = gettext('Required field(s) are missing');
                        return false;
                    }
                });
            });
        }
    };

    var initFile = function(file, meta, id) {
        var item = {
            file: file,
            meta: meta,
            progress: 0,
        };

        if (id != null) {
            item.meta._id = id;
            item.meta_id = id;
        }

        item.cssType = item.file.type.split('/')[0];
        $scope.items.unshift(item);
        $scope.enableSave = _.isNil($scope.errorMessage) && $scope.items.length > 0;
    };

    var getErrorMessage = function(type) {
        var errorMessage = gettext('Only the following files are allowed: ');
        var separator = '';
        var separatorAnd = ' ' + gettext('and') + ' ';

        if ($scope.allowPicture && type !== 'image') {
            errorMessage += separator + gettext('image');
            separator = separatorAnd;
        }

        if ($scope.allowVideo && type !== 'video') {
            errorMessage += separator + gettext('video');
            separator = separatorAnd;
        }

        if ($scope.allowAudio && type !== 'audio') {
            errorMessage += separator + gettext('audio');
            separator = separatorAnd;
        }

        return errorMessage;
    };

    $scope.addFiles = function(files) {
        $scope.isDragging = false;

        $scope.errorMessage = null;
        if (!files.length) {
            return false;
        }
        if ($scope.uniqueUpload && files.length > 1) {
            $scope.errorMessage = gettext('Only one file can be uploaded');
            return false;
        }
        if (!$scope.uniqueUpload && $scope.maxUploads && (files.length + $scope.items.length) > $scope.maxUploads) {
            $scope.errorMessage = gettext('Select at most ') + $scope.maxUploads + gettext(' files to upload.');
            return false;
        }

        let imageFiles = [];

        _.each(files, (file) => {
            if (/^image/.test(file.type)) {
                imageFiles.push(file);
            } else {
                if (/^video/.test(file.type)) {
                    if (!$scope.allowVideo) {
                        $scope.errorMessage = getErrorMessage('video');
                    }
                } else if (/^audio/.test(file.type)) {
                    if (!$scope.allowAudio) {
                        $scope.errorMessage = getErrorMessage('audio');
                    }
                } else if ($scope.allowPicture || $scope.allowVideo || $scope.allowAudio) {
                    $scope.errorMessage = getErrorMessage('');
                }

                initFile(file, {
                    byline: $scope.currentUser.byline, // initialize meta.byline from user profile
                });
            }
        });

        if (imageFiles.length > 0) {
            if ($scope.allowPicture) {
                Promise.all(imageFiles.map((file) => getExifData(file)))
                    .then((filesWithExifDataAttached) => {
                        filesWithExifDataAttached.forEach((file) => {
                            var fileMeta = file.iptcdata;

                            initFile(file, {
                                byline: fileMeta.byline,
                                headline: fileMeta.headline,
                                description_text: fileMeta.caption,
                                copyrightnotice: fileMeta.copyright,
                            }, getPseudoId());
                        });
                    })
                    .then(() => {
                        $scope.imagesMetadata = $scope.items.map((item) => item.meta);
                        $scope.$apply();

                        // running promises sequentially
                        $scope.items.reduce(
                            (promise, item, i) => promise.then(
                                () => getDataUrl(item.file).then((url) => {
                                    $scope.$apply(() => {
                                        $scope.items[i].imageDataUrl = url;
                                    });
                                })
                            )
                            , Promise.resolve()
                        );
                    });
            } else {
                $scope.errorMessage = getErrorMessage('image');
            }
        }
    };

    $scope.upload = function() {
        var promises = [];

        _.each($scope.items, (item) => {
            if (!item.model && !item.progress) {
                item.upload = null;
                promises.push(uploadFile(item));
            }
        });
        if (promises.length) {
            return $q.all(promises);
        }
        return $q.when();
    };

    $scope.save = function() {
        validateFields();
        if (_.isNil($scope.errorMessage)) {
            $scope.saving = true;
            return $scope.upload().then(() => {
                $q.all(_.map($scope.items, (item) => {
                    archiveService.addTaskToArticle(item.meta);
                    return api.archive.update(item.model, item.meta);
                })).then((results) => {
                    $scope.resolve(results);
                });
            })
                .finally(() => {
                    $scope.saving = false;
                    checkFail();
                });
        } else {
            return Promise.reject();
        }
    };

    $scope.cancel = function() {
        _.each($scope.items, $scope.cancelItem, $scope);
        $scope.reject();
    };

    $scope.tryAgain = function() {
        $scope.failed = null;
        $scope.upload();
    };

    $scope.cancelItem = function(item, index) {
        if (!_.isNil(item)) {
            if (item.model) {
                api.archive.remove(item.model);
            } else if (item.upload && item.upload.abort) {
                item.upload.abort();
            }
        }
        if (index !== undefined) {
            $scope.items.splice(index, 1);
        }
        if (_.isEmpty($scope.items)) {
            $scope.enableSave = false;
        }
        checkFail();
    };

    $scope.canUpload = () => {
        if ($scope.uniqueUpload) {
            return $scope.items.length === 0;
        }
        return $scope.maxUploads === undefined || $scope.maxUploads > $scope.items.length;
    };

    if ($scope.locals && $scope.locals.data) {
        if ($scope.locals.data.files) {
            $scope.addFiles($scope.locals.data.files);
        } else {
            $scope.addFiles($scope.locals.data);
        }
    }
}
