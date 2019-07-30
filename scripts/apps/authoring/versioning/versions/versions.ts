import {isPublished} from 'apps/archive/utils';

VersioningController.$inject = ['$scope', 'authoring', 'desks', 'archiveService'];
function VersioningController($scope, authoring, desks, archiveService) {
    $scope.last = null;
    $scope.versions = null;
    $scope.selected = null;
    $scope.users = null;
    $scope.canRevert = false;
    $scope.desks = null;
    $scope.stages = null;

    function fetchVersions() {
        desks.initialize()
            .then(() => {
                $scope.desks = desks.desks;
                $scope.stages = desks.deskStages;
                $scope.users = desks.users;

                archiveService.getVersions($scope.item, desks, 'versions').then((versions) => {
                    $scope.versions = versions;
                    $scope.last = archiveService.lastVersion($scope.item, $scope.versions);

                    if (archiveService.isLegal($scope.item)) {
                        $scope.canRevert = false;
                        $scope.openVersion($scope.last);
                    } else {
                        $scope.canRevert = authoring.isEditable($scope.item) && !isPublished($scope.item);

                        if ($scope.item._autosave) {
                            $scope.selected = $scope.item._autosave;
                        } else {
                            $scope.openVersion($scope.last);
                        }
                    }
                });
            });
    }

    /**
     * Opens the given version for preview if the story is not editable
     * Or if editable but not dirty.
     * Then the last version can be edited only when editable and not dirty.
     */
    $scope.openVersion = function(version) {
        if (!$scope.item._editable) {
            $scope.preview(version);
        } else if ($scope.item._editable && !$scope.dirty) {
            $scope.selected = version;
            if (version === $scope.last && !$scope.item._autosave) {
                if (!$scope._editable) {
                    $scope.closePreview();
                }
            } else {
                $scope.preview(version);
            }
        }
    };

    /**
     * Revert to given version
     *
     * If the version is the last one and there is an autosave - drop autosave
     */
    $scope.revert = function(version) {
        $scope.$parent.revert(version).then(fetchVersions);
    };

    $scope.$watchGroup(['item._id', 'item._latest_version'], fetchVersions);
}

versioningVersionDirective.$inject = [];
function versioningVersionDirective() {
    return {
        templateUrl: 'scripts/apps/authoring/versioning/versions/views/versions.html',
    };
}

angular.module('superdesk.apps.authoring.versioning.versions', [])
    .directive('sdVersioningVersion', versioningVersionDirective)
    .controller('VersioningWidgetCtrl', VersioningController);
