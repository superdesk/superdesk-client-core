import _ from 'lodash';
import {uniq} from 'lodash';
import {validateMediaFieldsThrows} from 'apps/authoring/authoring/controllers/ChangeImageController';
import {logger} from 'core/services/logger';

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
    'gettextCatalog',
    'notify',
];

export function MultiImageEditController(
    $scope: IScope,
    modal,
    gettextCatalog,
    notify,
) {
    const saveHandler = $scope.saveHandler;

    $scope.images = angular.copy($scope.imagesOriginal);

    let unsavedChangesExist = false;

    $scope.$watch('imagesOriginal', (imagesOriginal: Array<any>) => {
        // add and remove images without losing metadata of the ones which stay
        const updatedImages = imagesOriginal.map((image) => {
            const existingImage = $scope.images.find(({_id}) => _id === image._id);

            return existingImage != null ? existingImage : {...image, ...$scope.metadata};
        });

        $scope.images = angular.copy(updatedImages);
    });

    $scope.placeholder = {};

    $scope.isDirty = () => unsavedChangesExist;

    $scope.selectImage = (image) => {
        image.unselected = !image.unselected;
        updateMetadata();
    };

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
            if (!item.unselected) {
                item[field] = $scope.metadata[field] || '';
            }
        });
    };

    $scope.save = (close) => {
        const imagesForSaving = angular.copy($scope.images);

        imagesForSaving.forEach((image) => {
            delete image.unselected;
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
            .then(() => {
                unsavedChangesExist = false;

                if (close && typeof $scope.successHandler === 'function') {
                    $scope.successHandler();
                }
            });
    };

    $scope.close = () => {
        if ($scope.isDirty()) {
            modal.confirm(
                gettextCatalog.getString('You have unsaved changes, do you want to continue?'),
                gettextCatalog.getString('Confirm'),
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

    $scope.getSelectedImages = () => ($scope.images || []).filter((item) => !item.unselected);

    updateMetadata();

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

        if (uniqueValues.length < 1) {
            return '';
        } else if (uniqueValues.length > 1) {
            $scope.placeholder[fieldName] = '(multiple values)';
            return '';
        } else {
            $scope.placeholder[fieldName] = '';
            return JSON.parse(uniqueValues[0]);
        }
    }
}

MultiImageEditDirective.$inject = ['asset'];
export function MultiImageEditDirective(asset) {
    return {
        scope: {
            imagesOriginal: '=',
            isUpload: '=',
            saveHandler: '=',
            cancelHandler: '=',
            successHandler: '=',
            hideEditPane: '=',
            getImageUrl: '=',
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
            scope.handleItemClick = function(event, image) {
                if (event.target != null && event.target.classList.contains('icon-close-small')) {
                    scope.onRemoveItem(image);
                } else {
                    scope.selectImage(image);
                }
            };
        },
    };
}
