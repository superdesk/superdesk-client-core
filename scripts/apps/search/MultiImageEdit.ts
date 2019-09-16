import _ from 'lodash';
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
}

MultiImageEditController.$inject = [
    '$scope',
    'modal',
    'notify',
];

export function MultiImageEditController(
    $scope: IScope,
    modal,
    notify,
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

    $scope.selectImage = (image) => {
        if ($scope.images.length === 1) {
            $scope.images[0].selected = true;
        } else {
            image.selected = !image.selected;
        }
        updateMetadata();
    };

    // wait for images for initial load
    $scope.$watch('images', (images: Array<any>) => {
        if (images != null && images.length) {
            images.forEach($scope.selectImage);
        }
    });

    $scope.onChange = (field) => {
        console.log('scope.onChange');
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
                    $scope.successHandler();
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
                        $scope.cancelHandler();
                    }
                });
        } else if (typeof $scope.cancelHandler === 'function') {
            $scope.cancelHandler();
        }
    };

    $scope.getSelectedImages = () => ($scope.images || []).filter((item) => item.selected);

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
            extra: compare('extra'),
            language: compare('language'),
            creditline: compare('creditline'),
        };
    }

    function compare(fieldName) {
        const uniqueValues = uniq(
            $scope.getSelectedImages()
                .filter((item) => item[fieldName] != null)

                // IArticle['subject'] is a collection of custom vocabulary items
                // stringifying is required to compare arrays
                .map((item) => JSON.stringify(item[fieldName])),
        );

        const defaultValues = {
            subject: [],
            extra: {},
        };

        if (uniqueValues.length < 1) {
            return defaultValues[fieldName] || '';
        } else if (uniqueValues.length > 1) {
            $scope.placeholder[fieldName] = '(multiple values)';
            return defaultValues[fieldName] || '';
        } else {
            $scope.placeholder[fieldName] = '';
            return JSON.parse(uniqueValues[0]);
        }
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
