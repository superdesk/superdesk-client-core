import _ from 'lodash';
import {get} from 'lodash';
import {uniq, pickBy, isEmpty, forEach} from 'lodash';
import {validateMediaFieldsThrows} from 'apps/authoring/authoring/controllers/ChangeImageController';
import {logger} from 'core/services/logger';
import {gettext} from 'core/utils';

interface IScope extends ng.IScope {
    validator: any;
    images: any;
    imagesOriginal: any;
    placeholder: any;
    isDirty: any;
    selectImage: any;
    onChange: any;
    metadata: any;
    save: any;
    close: any;
    getSelectedImages(): Array<any>;
    saveHandler(images): Promise<void>;
    successHandler?(): void;
    cancelHandler?(): void;
    getSelectedItemsLength(): number;
}

MultiImageEditController.$inject = [
    '$scope',
    'modal',
    'notify',
    'lock',
];

export function MultiImageEditController(
    $scope: IScope,
    modal,
    notify,
    lock,
) {
    const saveHandler = $scope.saveHandler;

    $scope.images = angular.copy($scope.imagesOriginal);

    let unsavedChangesExist = false;

    $scope.$watch('imagesOriginal', (imagesOriginal: Array<any>) => {
        // add and remove images without losing metadata of the ones which stay
        const updatedImages = imagesOriginal.map((image) => {
            const existingImage = $scope.images.find(({_id}) => _id === image._id);

            return existingImage != null
                ? existingImage
                : {...image, ...pickBy($scope.metadata, (value) => !isEmpty(value))};
        });

        $scope.images = angular.copy(updatedImages);
    });

    $scope.placeholder = {};

    $scope.isDirty = () => unsavedChangesExist;

    $scope.selectImage = (image, update: boolean = true) => {
        if ($scope.images.length === 1) {
            $scope.images[0].selected = true;
        } else {
            image.selected = !image.selected;
        }

        if (update) {
            // refresh metadata visible in the editor according to selected images
            updateMetadata();
        }
    };

    // wait for images for initial load
    $scope.$watch('images', (images: Array<any>) => {
        if (images != null && images.length) {
            images.forEach((image) => $scope.selectImage(image, false));
            updateMetadata();
        }
    });

    $scope.onChange = (field) => {
        try {
            if (field == null) {
                throw new Error('field required');
            }
        } catch (e) {
            logger.error(e);
            return;
        }

        unsavedChangesExist = true;
        $scope.placeholder[field] = '';

        $scope.images.forEach((item) => {
            if (item.selected) {
                item[field] = $scope.metadata[field] || '';
            }
        });
    };

    $scope.save = (close) => {
        const imagesForSaving = angular.copy($scope.images);

        imagesForSaving.forEach((image) => {
            delete image.selected;
        });

        try {
            imagesForSaving.forEach((metadata) => {
                validateMediaFieldsThrows($scope.validator, metadata);
            });
        } catch (e) {
            notify.error(e);
            return;
        }

        saveHandler(imagesForSaving)
            .then((res: any) => {
                if (res != null) {
                    $scope.images = angular.copy(Array.isArray(res) && res.length > 0 ? res : [res]);
                }
                unsavedChangesExist = false;

                if (close && typeof $scope.successHandler === 'function') {
                    unlockAndCloseModal($scope.successHandler);
                }
            });
    };

    $scope.close = () => {
        if ($scope.isDirty()) {
            modal.confirm(
                gettext('You have unsaved changes, do you want to continue?'),
                gettext('Confirm'),
            )
                .then(() => {
                    if (typeof $scope.cancelHandler === 'function') {
                        unlockAndCloseModal($scope.cancelHandler);
                    }
                });
        } else if (typeof $scope.cancelHandler === 'function') {
            unlockAndCloseModal($scope.cancelHandler);
        }
    };

    $scope.$on('item:lock', (_e, data) => {
        const {imagesOriginal} = $scope;

        // while editing metadata if any selected item is unlocked by another user remove that item from selected items
        if (Array.isArray(imagesOriginal) && data != null && data.item != null) {
            const unlockedItem = imagesOriginal.find((image) => image._id === data.item);

            notify.error(
                gettext(
                    'Item {{headline}} unlocked by another user.',
                    {headline: unlockedItem.headline || unlockedItem.slugline},
                )
            );
            $scope.imagesOriginal = angular.copy(imagesOriginal.filter((image) => image._id !== data.item));
            $scope.metadata = {};
        }
    });

    $scope.getSelectedImages = () => ($scope.images || []).filter((item) => item.selected);

    $scope.getSelectedItemsLength = () => $scope.getSelectedImages().length || 0;

    function unlockAndCloseModal(callback) {
        // Before closing the modal unlock all the selected items
        const unlockItems = $scope.images.map((item) => {
            // In case of new upload there will be no lock on item
            // so make sure to unlock only those items which are locked
            if (item._locked === true) {
                return lock.unlock(item);
            }
            return item;
        });

        Promise.all(unlockItems).then(callback);
    }

    function updateMetadata() {
        $scope.metadata = {
            // subject is required to "usage terms" and other custom fields are editable
            subject: compare('subject'),
            headline: compare('headline'),
            description_text: compare('description_text'),
            archive_description: compare('archive_description'),
            alt_text: compare('alt_text'),
            byline: compare('byline'),
            copyrightholder: compare('copyrightholder'),
            usageterms: compare('usageterms'),
            copyrightnotice: compare('copyrightnotice'),
            extra: compareExtra(),
            language: compare('language'),
            creditline: compare('creditline'),
        };
    }

    function getUniqueValues(field: string) {
        const uniqueValues = {};

        $scope.getSelectedImages()
            .map((item) => get(item, field))
            .filter((value) => value != null && value !== '')
            .map((value) => JSON.stringify(value))
            .forEach((value) => uniqueValues[value] = 1);
        return Object.keys(uniqueValues);
    }

    /**
     * Populate .extra metadata for editing.
     *
     * Works like compare() but for custom fields stored in .extra.
     */
    function compareExtra() {
        // get unique values for each extra field
        const extra = {};
        const values = {};

        $scope.getSelectedImages().forEach((item) => {
            if (item.extra != null) {
                for (const field in item.extra) {
                    if (!values.hasOwnProperty(field)) {
                        values[field] = getUniqueValues('extra.' + field);
                        extra[field] = getMetaValue(field, values[field]);
                    }
                }
            }
        });

        return extra;
    }

    function getMetaValue(field: string, uniqueValues: Array<string>, defaultValue = null) {
        $scope.placeholder[field] = '';

        if (uniqueValues.length === 1) {
            return JSON.parse(uniqueValues[0]);
        } else if (uniqueValues.length > 1) {
            $scope.placeholder[field] = gettext('(multiple values)');
        }

        return defaultValue || '';
    }

    function compare(fieldName) {
        const uniqueValues = getUniqueValues(fieldName);
        const defaultValues = {subject: []};

        return getMetaValue(fieldName, uniqueValues, defaultValues[fieldName]);
    }
}

MultiImageEditDirective.$inject = ['asset', '$sce'];
export function MultiImageEditDirective(asset, $sce) {
    return {
        scope: {
            imagesOriginal: '=',
            isUpload: '=',
            saveHandler: '=',
            cancelHandler: '=',
            successHandler: '=',
            hideEditPane: '=',
            getThumbnailHtml: '=',
            getIconForItemType: '=',
            getProgress: '=',
            onRemoveItem: '=',
            uploadInProgress: '=',
            validator: '=',
        },
        transclude: {
            'additional-content': '?sdMultiEditAdditionalContent',
            'select-desk': '?sdMultiEditSelectDesk',
        },
        controller: MultiImageEditController,
        templateUrl: asset.templateUrl('apps/search/views/multi-image-edit.html'),
        link: function(scope) {
            scope.trustAsHtml = $sce.trustAsHtml;
            scope.metadataDirty = false;

            scope.handleItemClick = function(event, image) {
                if (event.target != null && event.target.classList.contains('icon-close-small')) {
                    scope.onRemoveItem(image);
                } else {
                    scope.selectImage(image);
                }
            };

            scope.setMetadataDirty = (value) => {
                scope.metadataDirty = value;
                forEach(scope.metadata, (metadata, key) => {
                    scope.onChange(key);
                });
            };
        },
    };
}
