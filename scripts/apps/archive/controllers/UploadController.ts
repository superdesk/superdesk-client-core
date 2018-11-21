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
    'desks',
    'notify',
];
export function UploadController($scope, $q, upload, api, archiveService, session, deployConfig, desks, notify) {
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

    Promise.all([desks.fetchDesks(), desks.getCurrentDesk()]).then(([desks, currentDesk]) => {
        $scope.desks = desks._items;
        $scope.selectedDesk = currentDesk;
    });

    $scope.selectDesk = (desk) => {
        $scope.selectedDesk = desk;
    };

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
        $scope.enableSave = $scope.items.length > 0;
    };

    $scope.addFiles = function(files) {
        $scope.isDragging = false;

        if (!files.length) {
            return false;
        }
        if ($scope.uniqueUpload && files.length > 1) {
            notify.error(gettext('Only one file can be uploaded'));
            return false;
        }
        if (!$scope.uniqueUpload && $scope.maxUploads && (files.length + $scope.items.length) > $scope.maxUploads) {
            notify.error(gettext('Select at most ') + $scope.maxUploads + gettext(' files to upload.'));
            return false;
        }

        let acceptedFiles = [];
        let uploadOfDisallowedFileTypesAttempted = false;

        _.each(files, (file) => {
            if (/^image/.test(file.type)) {
                if ($scope.allowPicture) {
                    acceptedFiles.push(file);
                } else {
                    uploadOfDisallowedFileTypesAttempted = true;
                }
            } else if (/^video/.test(file.type)) {
                if ($scope.allowVideo) {
                    acceptedFiles.push(file);
                } else {
                    uploadOfDisallowedFileTypesAttempted = true;
                }
            } else if (/^audio/.test(file.type)) {
                if ($scope.allowAudio) {
                    acceptedFiles.push(file);
                } else {
                    uploadOfDisallowedFileTypesAttempted = true;
                }
            } else {
                uploadOfDisallowedFileTypesAttempted = true;
            }
        });

        if (uploadOfDisallowedFileTypesAttempted === true) {
            const message = gettext('Only the following files are allowed: ')
                + ($scope.allowPicture ? gettext('image') : '')
                + ($scope.allowVideo ? ', ' + gettext('video') : '')
                + ($scope.allowAudio ? ', ' + gettext('audio') : '');

            notify.error(message);
        }

        if (acceptedFiles.length > 0) {
            Promise.all(acceptedFiles.map((file) => getExifData(file)))
                .then((filesWithExifDataAttached) => {
                    filesWithExifDataAttached.forEach((file) => {
                        var fileMeta = file.iptcdata;

                        initFile(file, {
                            byline: fileMeta.byline || $scope.currentUser.byline,
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
        $scope.saving = true;
        return $scope.upload().then(() => {
            $q.all(_.map($scope.items, (item) => {
                archiveService.addTaskToArticle(item.meta, $scope.selectedDesk);
                return api.archive.update(item.model, item.meta);
            })).then((results) => {
                $scope.resolve(results);
            });
        })
            .finally(() => {
                $scope.saving = false;
                checkFail();
            });
    };

    $scope.cancel = function() {
        $scope.reject();
    };

    $scope.tryAgain = function() {
        $scope.failed = null;
        $scope.upload();
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
