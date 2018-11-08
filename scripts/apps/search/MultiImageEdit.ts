import _ from 'lodash';
import {validateMediaFieldsThrows} from 'apps/authoring/authoring/controllers/ChangeImageController';

interface IScope extends ng.IScope {
    validator: any;
    origin: any;
    imagesOriginal: any;
    placeholder: any;
    isDirty: any;
    selectImage: any;
    onChange: any;
    metadata: any;
    save: any;
    close: any;
    saveHandler(origin): Promise<void>;
    closeHandler(): void;
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

    $scope.origin = angular.copy($scope.imagesOriginal);

    let unsavedChangesExist = false;

    $scope.$watch('imagesOriginal', (imagesOriginal: Array<any>) => {
        // add and remove images without losing metadata of the ones which stay
        const updatedImages = imagesOriginal.map((image) => {
            const existingImage = $scope.origin.find(({_id}) => _id === image._id);

            return existingImage != null ? existingImage : {...image, ...$scope.metadata};
        });

        $scope.origin = angular.copy(updatedImages);
    });

    $scope.placeholder = {};

    $scope.isDirty = () => unsavedChangesExist;

    $scope.selectImage = (image) => {
        image.unselected = !image.unselected;
        updateMetadata();
    };

    $scope.onChange = (field) => {
        unsavedChangesExist = true;
        $scope.placeholder[field] = '';

        $scope.origin.forEach((item) => {
            if (!item.unselected) {
                item[field] = $scope.metadata[field] || '';
            }
        });
    };

    $scope.save = (close) => {
        const imagesForSaving = angular.copy($scope.origin);

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

                if (close) {
                    $scope.closeHandler();
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
                    $scope.closeHandler();
                });
        } else {
            $scope.closeHandler();
        }
    };

    updateMetadata();

    function updateMetadata() {
        $scope.metadata = {
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
        const mapOfValues = ($scope.origin || []).filter((item) => !item.unselected).reduce((acc, item) => {
            acc[item[fieldName]] = true;
            return acc;
        }, {});

        const uniqueValues = Object.keys(mapOfValues);

        if (uniqueValues.length < 1) {
            return '';
        } else if (uniqueValues.length > 1) {
            $scope.placeholder[fieldName] = '(multiple values)';
            return '';
        } else {
            $scope.placeholder[fieldName] = '';
            return uniqueValues[0];
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
            closeHandler: '=',
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
                if (event.target != null && event.target.classList.contains("icon-close-small")) {
                    scope.onRemoveItem(image);
                } else {
                    scope.selectImage(image);
                }
            };
        },
    };
}
