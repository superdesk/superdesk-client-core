import _ from 'lodash';
import {getDataUrl} from 'core/upload/image-preview-directive';
import {gettext} from 'core/utils';
import {isEmpty, pickBy} from 'lodash';
import {handleBinaryFile} from '@metadata/exif';
import {extensions} from 'appConfig';
import {IPTCMetadata, IUser, IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {fileUploadErrorModal} from './file-upload-error-modal';
import {showModal} from 'core/services/modalService';

const isNotEmptyString = (value: any) => value != null && value !== '';

/* eslint-disable complexity */

function getExifData(file: File): Promise<IPTCMetadata> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            try {
                const exif: { iptcdata: IPTCMetadata } = handleBinaryFile(reader.result);

                resolve(exif.iptcdata);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function mapIPTCExtensions(metadata: IPTCMetadata, user: IUser, parent?: IArticle): Promise<Partial<IArticle>> {
    const meta: Partial<IPTCMetadata> = Object.assign({
        'By-line': user.byline,
    }, pickBy(metadata, isNotEmptyString));

    const item = {
        byline: meta['By-line']?.toString() || user.byline,
        headline: meta.Headline?.toString(),
        description_text: meta['Caption-Abstract']?.toString(),
        copyrightnotice: meta.CopyrightNotice?.toString(),
        language: meta.LanguageIdentifier?.toString(),
        creditline: meta.Credit?.toString(),
    };

    return Object.values(extensions).filter(({activationResult}) =>
        activationResult.contributions?.iptcMapping,
    ).reduce(
        (accumulator, {activationResult}) =>
            accumulator.then((_item) => activationResult.contributions.iptcMapping(meta, _item, parent)),
        Promise.resolve(item),
    ).then((_item: Partial<IArticle>) => pickBy(_item, isNotEmptyString));
}

function serializePromises(promiseCreators: Array<() => Promise<any>>): Promise<Array<any>> {
    let promise = Promise.resolve();

    return Promise.all(promiseCreators.map((promiseCreator) => {
        promise = promise.then(promiseCreator);
        return promise;
    }));
}

UploadController.$inject = [
    '$scope',
    '$q',
    'upload',
    'api',
    'archiveService',
    'session',
    'desks',
    'notify',
    '$location',
    'modal',
];
export function UploadController(
    $scope,
    $q,
    upload,
    api,
    archiveService,
    session,
    desks,
    notify,
    $location,
    modal,
) {
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
    $scope.validator = _.omit(appConfig.validator_media_metadata, ['archive_description']);
    $scope.parent = $scope.locals?.data?.parent || null;
    $scope.deskSelectionAllowed = ($location.path() !== '/workspace/personal') && $scope.locals &&
        $scope.locals.data && $scope.locals.data.deskSelectionAllowed === true;

    if ($scope.deskSelectionAllowed === true) {
        Promise.all([desks.fetchDesks(), desks.getCurrentDesk()]).then(([_desks, currentDesk]) => {
            $scope.desks = _desks._items;
            $scope.selectedDesk = currentDesk;
        });
    }

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
    $scope.getThumbnailHtml = (imageMeta) => {
        const item = getItemByMetaId(imageMeta._id);

        return item == null ? '' : item.thumbnailHtml;
    };
    $scope.getIconForItemType = (imageMeta) => {
        const item = getItemByMetaId(imageMeta._id);

        return 'icon-' + (item.cssType === 'image' ? 'photo' : item.cssType);
    };
    $scope.invokeImagesInput = () => {
        var el: HTMLElement = document.querySelector('#images-input');

        el.click();
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
            if (reason && reason.data && reason.data.code) {
                notify.error(gettext('Upload Error:') + ' ' + reason.data.code);
            }

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
            cssType: file.type.split('/')[0],
            thumbnailHtml: '',
        };

        if (id != null) {
            item.meta._id = id;
            item['meta_id'] = id;
        }

        $scope.items.unshift(item);
        $scope.enableSave = $scope.items.length > 0;
        return item;
    };

    $scope.addFiles = function(files: Array<File>) {
        $scope.isDragging = false;

        if (!files.length) {
            return false;
        }
        if ($scope.uniqueUpload && files.length > 1) {
            notify.error(gettext('Only one file can be uploaded'));
            return false;
        }
        if (!$scope.uniqueUpload && $scope.maxUploads && (files.length + $scope.items.length) > $scope.maxUploads) {
            notify.error(gettext('Select at most {{maxUploads}} files to upload.', {maxUploads: $scope.maxUploads}));
            return false;
        }

        let acceptedFiles: Array<{ file: File, getThumbnail: (file: File) => Promise<string> }> = [];
        let invalidFiles = [];

        const fileDimensionsValid = (file: File) => {
            if (appConfig.pictures) {
                return getDataUrl(file).then((dataUrl) => {
                    return new Promise((resolve) => {
                        let img = document.createElement('img');

                        img.src = dataUrl;
                        img.onload = function() {
                            if (img.width && img.width >= appConfig.pictures.minWidth
                                && img.height > appConfig.pictures.minHeight) {
                                return resolve({valid: true, name: file.name});
                            } else {
                                return resolve({
                                    valid: false,
                                    name: file.name,
                                    width: img.width,
                                    height: img.height,
                                    type: file.type,
                                });
                            }
                        };
                    });
                });
            } else {
                return Promise.resolve({valid: true});
            }
        };

        return Promise.all(_.map(files, (file): any => {
            if (file.type.startsWith('image')) {
                if (!$scope.allowPicture) {
                    return Promise.resolve({error: {isAllowedFileType: false}});
                }
                return fileDimensionsValid(file).then((data: {[key: string]: string}) => {
                    if (data.valid) {
                        return {
                            file: file,
                            getThumbnail: () => getDataUrl(file).then((uri) => `<img src="${uri}" />`),
                        };
                    } else {
                        return {error: data};
                    }
                });
            } else if (file.type.startsWith('video')) {
                if (!$scope.allowVideo) {
                    return Promise.resolve({error: {isAllowedFileType: false}});
                }
                return Promise.resolve({
                    file: file,
                    getThumbnail: () => Promise.resolve('<i class="icon--2x icon-video"></i>'),
                });
            } else if (file.type.startsWith('audio')) {
                if (!$scope.allowAudio) {
                    return Promise.resolve({error: {isAllowedFileType: false}});
                }
                return Promise.resolve({
                    file: file,
                    getThumbnail: () => Promise.resolve('<i class="icon--2x icon-audio"></i>'),
                });
            } else {
                return Promise.resolve({error: {isAllowedFileType: false}});
            }
        })).then((result) => {
            let uploadOfDisallowedFileTypesAttempted: boolean = false;

            result.forEach((file) => {
                if (!file.error) {
                    acceptedFiles.push({
                        file: file.file,
                        getThumbnail: file.getThumbnail,
                    });
                } else if (file.error.isAllowedFileType === false) {
                    uploadOfDisallowedFileTypesAttempted = true;
                } else {
                    invalidFiles.push(file.error);
                }
            });

            if (uploadOfDisallowedFileTypesAttempted) {
                const message = gettext('Only the following files are allowed: ')
                    + ($scope.allowPicture ? gettext('image') : '')
                    + ($scope.allowVideo ? ', ' + gettext('video') : '')
                    + ($scope.allowAudio ? ', ' + gettext('audio') : '');

                notify.error(message);
            }

            showModal(fileUploadErrorModal(invalidFiles));

            return acceptedFiles.length < 1
                ? Promise.resolve()
                : Promise.all(acceptedFiles.map(
                    ({file, getThumbnail}) =>
                        getExifData(file)
                            .then(
                                (fileMeta) => mapIPTCExtensions(fileMeta, $scope.currentUser, $scope.parent),
                                () => ({}), // proceed with upload on exif parsing error
                            )
                            .then((meta) => {
                                const item = initFile(file, meta, getPseudoId());

                                return getThumbnail(file).then((htmlString) => item.thumbnailHtml = htmlString);
                            }),
                )).then(() => {
                    $scope.$applyAsync(() => {
                        $scope.imagesMetadata = $scope.items.map((item) => item.meta);
                    });
                });
        });
    };

    $scope.upload = function() {
        if (isEmpty($scope.items)) {
            return Promise.resolve();
        }

        // upload items in sequence, and resolve when all are done
        return serializePromises($scope.items.map((item) => {
            if (!item.model && !item.progress) {
                item.upload = null;
                return () => uploadFile(item);
            }

            return () => Promise.resolve(item);
        }));
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
