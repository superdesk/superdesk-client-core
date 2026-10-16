import _ from 'lodash';
import {getDataUrl} from 'core/upload/image-preview-directive';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {fileUploadErrorModal} from './file-upload-error-modal';
import {showModal} from '@sourcefabric/common';
import {sdApi} from 'api';
import {COMPANION_FIELD_IDS, FIELD_ID_TO_STORED_FIELD} from 'apps/authoring-react/data-layer-constants';

interface IStagedUpload {
    _id: string;
    _etag: string;
    status: 'pending' | 'processing' | 'awaiting_confirmation' | 'ready' | 'failed' | 'committing';
    metadata_status: 'pending' | 'ready' | 'failed';
    metadata_error?: string;
    confirmed?: boolean;
    meta: Partial<IArticle>;
    error?: string;
}

/**
 * Drop synthetic/companion profile fields the archive schema rejects, mirroring `data-layer.ts`:
 * COMPANION_FIELD_IDS have no backing field; FIELD_ID_TO_STORED_FIELD ids are stored elsewhere.
 */
function sanitizeUploadMeta(meta: Partial<IArticle>): Partial<IArticle> {
    const sanitized: Record<string, any> = {...meta};

    for (const [fieldId, storedField] of Object.entries(FIELD_ID_TO_STORED_FIELD)) {
        if (sanitized[fieldId] != null && sanitized[storedField] == null) {
            sanitized[storedField] = sanitized[fieldId];
        }
        delete sanitized[fieldId];
    }
    for (const fieldId of COMPANION_FIELD_IDS) {
        delete sanitized[fieldId];
    }

    return sanitized;
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
    '$timeout',
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
    $timeout,
) {
    $scope.items = [];
    $scope.saving = false;
    $scope.failed = false;
    $scope.enableSave = false;
    $scope.processing = false;
    $scope.currentUser = session.identity;
    $scope.uniqueUpload = $scope.locals && $scope.locals.data && $scope.locals.data.uniqueUpload === true;
    $scope.maxUploads = !$scope.uniqueUpload && $scope.locals && $scope.locals.data &&
        $scope.locals.data.maxUploads ? $scope.locals.data.maxUploads : undefined;
    $scope.allowPicture = !($scope.locals && $scope.locals.data && $scope.locals.data.allowPicture === false);
    $scope.allowVideo = !($scope.locals && $scope.locals.data && $scope.locals.data.allowVideo === false);
    $scope.allowAudio = !($scope.locals && $scope.locals.data && $scope.locals.data.allowAudio === false);
    $scope.validator = _.omit(appConfig.validator_media_metadata, ['archive_description']);
    $scope.parent = $scope.locals?.data?.parent || null;
    $scope.deskSelectionAllowed = !sdApi.navigation.isPersonalSpace() && $scope.locals &&
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
    let closed = false;
    const getPseudoId = () => ++pseudoId;

    const getItemByMetaId = (metaId) => $scope.items.find((item) => item.meta_id === metaId);
    const markDiscarded = (item) => {
        item.discarded = true;
        if (item.processingTimeout != null) {
            $timeout.cancel(item.processingTimeout);
        }
    };

    const updateProcessingState = () => {
        $scope.processing = $scope.items.some((item) => item.staged == null
            || item.staged.status === 'pending' || item.staged.status === 'processing');
        $scope.metadataPending = $scope.items.some((item) => !item.metadataApplied);
        $scope.pendingItems = $scope.items.filter((item) => !item.metadataApplied);
        $scope.failed = $scope.items.some((item) => item.processingError != null);
        $scope.removing = $scope.items.some((item) => item.removing);
    };

    $scope.onRemoveItem = (imageMeta) => {
        if ($scope.saving) {
            return;
        }
        const removed = getItemByMetaId(imageMeta._id);

        if (removed == null || removed.removing) {
            return;
        }
        markDiscarded(removed);
        $scope.items = $scope.items.filter((item) => item !== removed);
        $scope.imagesMetadata = $scope.items.filter((item) => item.metadataApplied).map((item) => item.meta);
        updateProcessingState();
        return Promise.resolve();
    };

    $scope.imagesMetadata = [];
    $scope.pendingItems = [];
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
            }
        });

        return $scope.save();
    };

    const failProcessing = (item, message: string) => {
        $timeout.cancel(item.processingTimeout);
        item.processingError = message;
        item.staged.status = 'failed';
        notify.error(gettext('Upload Error:') + ' ' + item.file.name + ': ' + message);
        item.ready.reject(new Error(message));
        updateProcessingState();
    };

    const applyStaged = (item, staged: IStagedUpload) => {
        if (item.discarded) {
            return;
        }
        item.staged = staged;
        if (!item.metadataApplied && (staged.metadata_status !== 'pending' || staged.status === 'failed')) {
            Object.assign(item.meta, {byline: $scope.currentUser.byline}, staged.meta);
            item.metadataApplied = true;
            if (staged.metadata_status === 'failed') {
                const message = staged.metadata_error
                    || gettext('Metadata extraction failed. Enter metadata manually.');

                notify.warning(message);
            }
            $scope.imagesMetadata = $scope.items.filter((i) => i.metadataApplied).map((i) => i.meta);
        }
        if (staged.status === 'ready') {
            $timeout.cancel(item.processingTimeout);
            item.ready.resolve();
        } else if (staged.status === 'failed' && item.processingError == null) {
            const message = staged.error || gettext('Media processing failed. Remove the file and try again.');

            failProcessing(item, message);
        }
        updateProcessingState();
    };

    const startProcessingDeadline = (item) => {
        $timeout.cancel(item.processingTimeout);
        item.processingTimeout = $timeout(() => {
            if (!['ready', 'awaiting_confirmation'].includes(item.staged.status) && !item.discarded) {
                failProcessing(item, gettext('Media processing timed out. Remove the file and try again.'));
            }
        }, 10 * 60 * 1000);
    };

    const readStaged = (id: string): Promise<IStagedUpload> =>
        api.find('upload_staging', id, {}, false);

    const mutateStaged = async (item, action: (staged: IStagedUpload) => Promise<unknown>) => {
        let staged = item.staged;

        for (let attempt = 0; ; attempt++) {
            try {
                return await action(staged);
            } catch (reason) {
                if (reason?.status !== 412 || attempt >= 2) {
                    throw reason;
                }
                staged = await readStaged(staged._id);
            }
        }
    };

    const refreshStaged = (item) => {
        // Serialize refreshes so an older response cannot overwrite a newer terminal status.
        item.refresh = (item.refresh || Promise.resolve()).then(() => {
            if (item.discarded || item.staged.status === 'ready') {
                return;
            }
            return readStaged(item.staged._id).then((staged) => {
                return new Promise<void>((resolve) => $scope.$applyAsync(() => {
                    applyStaged(item, staged);
                    resolve();
                }));
            });
        }).catch((reason) => {
            if (!item.discarded) {
                $scope.$applyAsync(() => {
                    failProcessing(item, reason?.data?._message || gettext('Unable to check media processing status.'));
                });
            }
        });
        return item.refresh;
    };

    $scope.$on('upload_staging:updated', (_event, data) => {
        if (data.user !== $scope.currentUser._id) {
            return;
        }
        const item = $scope.items.find((i) => i.staged?._id === data.staged_id);

        if (item != null) {
            refreshStaged(item);
        }
    });
    $scope.$on('connected', () => {
        $scope.items.filter((item) => item.staged != null && !item.model).forEach(refreshStaged);
    });

    // Only storage happens in this request; metadata and rendition processing run in workers.
    const stageFile = (item) => {
        item.staging = api('upload_staging').url().then((url) => {
            item.stagingUpload = upload.start({
                method: 'POST',
                url: url,
                data: {media: item.file},
                headers: api.archive.getHeaders(),
            });

            return item.stagingUpload.then((response: {data: IStagedUpload & {_issues?: unknown}}) => {
                if (response.data._issues) {
                    return $q.reject(response);
                }

                item.staged = response.data;
                if (item.discarded) {
                    return item;
                }
                item.progress = 100;
                startProcessingDeadline(item);
                $scope.$applyAsync(() => {
                    applyStaged(item, response.data);
                });
                // Covers completion notifications delivered before the staging POST response.
                refreshStaged(item);

                return item;
            }, null, (progress) => {
                $scope.$applyAsync(() => {
                    item.progress = progress.total > 0
                        ? Math.round(progress.loaded / progress.total * 100.0) : 0;
                });
            });
        }).catch((reason) => {
            const code = reason?.data?.code ?? reason?.data?._message;

            if (!item.discarded) {
                notify.error(gettext('Upload Error:') + (code ? ' ' + code : ''));
            }
            $scope.$applyAsync(() => $scope.onRemoveItem(item.meta));
            return $q.reject(reason);
        });

        return item.staging;
    };

    var initFile = function(file, meta, id) {
        var item = {
            file: file,
            meta: meta,
            progress: 0,
            cssType: file.type.split('/')[0],
            thumbnailHtml: '',
            thumbnailUrl: '',
            ready: $q.defer(),
        };

        // Failures are displayed immediately and also reject a pending Upload confirmation.
        item.ready.promise.catch(() => undefined);

        if (id != null) {
            item.meta._id = id;
            item['meta_id'] = id;
        }

        $scope.items.unshift(item);
        $scope.$applyAsync(updateProcessingState);
        $scope.enableSave = $scope.items.length > 0;
        return item;
    };

    $scope.addFiles = function(files: Array<File>) {
        $scope.isDragging = false;

        if ($scope.saving) {
            return false;
        }
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
                            getThumbnail: () => getDataUrl(file),
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
                    getThumbnail: () => Promise.resolve(''),
                });
            } else if (file.type.startsWith('audio')) {
                if (!$scope.allowAudio) {
                    return Promise.resolve({error: {isAllowedFileType: false}});
                }
                return Promise.resolve({
                    file: file,
                    getThumbnail: () => Promise.resolve(''),
                });
            } else {
                return Promise.resolve({error: {isAllowedFileType: false}});
            }
        })).then((result) => {
            if (closed) {
                return;
            }
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
                const allowedTypes = [];

                if ($scope.allowPicture) {
                    allowedTypes.push(gettext('image'));
                }

                if ($scope.allowVideo) {
                    allowedTypes.push(gettext('video'));
                }

                if ($scope.allowAudio) {
                    allowedTypes.push(gettext('audio'));
                }

                const message = gettext(
                    'Only the following files are allowed: {{fileTypes}}',
                    {fileTypes: allowedTypes.join(', ')},
                );

                notify.error(message);
            }

            showModal(fileUploadErrorModal(invalidFiles));

            return Promise.all(acceptedFiles.map(({file, getThumbnail}) => {
                const item = initFile(file, {}, getPseudoId());

                getThumbnail(file).then((uri) => {
                    $scope.$applyAsync(() => {
                        item.thumbnailUrl = uri;
                        item.thumbnailHtml = uri
                            ? `<img src="${uri}" />` : `<i class="icon--2x icon-${item.cssType}"></i>`;
                    });
                }).catch(() => {
                    notify.warning(gettext('Unable to generate a preview for {{filename}}.', {filename: file.name}));
                });

                return stageFile(item).catch(() => undefined);
            }));
        });
    };

    $scope.save = function() {
        if ($scope.saving || $scope.metadataPending || $scope.failed || $scope.removing || !$scope.items.length) {
            return $q.reject(new Error(gettext('Media is not ready to upload.')));
        }
        $scope.saving = true;

        return Promise.all($scope.items.map((item) => item.staging)).then(() => {
            return Promise.all($scope.items.map(async (item) => {
                if (item.cssType === 'video' && item.staged.status !== 'ready' && !item.staged.confirmed) {
                    await mutateStaged(item, (staged) => {
                        if (staged.confirmed || staged.status === 'ready') {
                            return Promise.resolve();
                        }
                        return api.update('upload_staging', staged, {confirmed: true});
                    });
                    startProcessingDeadline(item);
                    await refreshStaged(item);
                }
                await item.ready.promise;
            }));
        }).then(() => {
            return $q.all($scope.items.map((item) => {
                if (item.model != null) {
                    return item.model;
                }
                archiveService.addTaskToArticle(item.meta, $scope.selectedDesk);

                // meta._id is only a local pseudo-id used by the multi-edit form
                return api('archive').save({}, {
                    ..._.omit(sanitizeUploadMeta(item.meta), '_id'),
                    staged_id: item.staged._id,
                }).then((model) => {
                    item.model = model;
                    return model;
                });
            }));
        }).then((results) => {
            $scope.resolve(results);
        }).catch((reason) => {
            notify.error(reason?.data?._message || gettext('Unable to create archive item.'));
            return $q.reject(reason);
        }).finally(() => {
            $scope.$applyAsync(() => {
                $scope.saving = false;
            });
        });
    };

    $scope.cancel = function() {
        closed = true;
        $scope.items.forEach(markDiscarded);
        $scope.items = [];
        $scope.imagesMetadata = [];
        updateProcessingState();
        $scope.reject();
    };

    $scope.$on('$destroy', () => {
        closed = true;
        $scope.items.forEach(markDiscarded);
    });

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
