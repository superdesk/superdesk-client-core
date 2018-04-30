/* global _ */

/**
 * @ngdoc service
 * @module superdesk.apps.search
 * @name multiImageEdit
 *
 * @requires $modal
 * @requires authoring
 *
 * @description Service for editing metadata of multiple images at same time
 */
MultiImageEditService.$inject = ['$modal', 'authoring'];
export function MultiImageEditService($modal, authoring) {
    this.edit = (data) => {
        $modal.open({
            templateUrl: 'scripts/apps/search/views/multi-image-edit.html',
            controller: ['$scope', 'config', function($scope, config) {
                $scope.validator = config.validatorMediaMetadata;

                $scope.origin = angular.copy(data);
                $scope.images = angular.copy(data);

                $scope.placeholder = {};
                $scope.isDirty = {};

                $scope.isDirty = () => !_.isEmpty($scope.isDirty);

                $scope.selectImage = (image) => {
                    image.unselected = !image.unselected;
                    image.unselected ?
                        _.remove($scope.images, (res) => res._id === image._id) :
                        $scope.images.push(image);

                    return updateMetadata();
                };

                $scope.onBlur = () => {
                    _.map($scope.origin, (item) => {
                        if (_.find($scope.images, (image) => image._id === item._id)) {
                            _.merge(item, _.pick($scope.metadata, _.keys($scope.isDirty)));
                        }
                    });
                };

                $scope.onChange = (field) => {
                    $scope.isDirty[field] = true;
                    $scope.placeholder[field] = '';
                };

                $scope.save = (close) => {
                    angular.forEach(data, (image) => {
                        authoring.save(image, _.find($scope.origin, (item) => item._id === image._id));
                    });

                    if (close) {
                        $scope.$close();
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

                function compare(value) {
                    if (!$scope.images.length) {
                        $scope.placeholder = {};
                        return '';
                    }

                    let uniqueValue = true;
                    let initialValue = _.find($scope.origin, (origImage) => origImage._id === $scope.images[0]._id);

                    angular.forEach($scope.images, (image) => {
                        let compareImage = _.find($scope.origin, (origImage) => origImage._id === image._id);

                        if (initialValue[value] !== compareImage[value]) {
                            uniqueValue = false;
                        }
                    });

                    if (uniqueValue) {
                        $scope.placeholder[value] = '';
                        return initialValue[value];
                    }

                    $scope.placeholder[value] = '(multiple values)';

                    return '';
                }
            }],
            size: 'fullscreen modal--dark-ui',
        });
    };
}