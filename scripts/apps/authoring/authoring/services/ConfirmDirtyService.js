/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name confirm
 *
 * @requires $window
 * @requires $q
 * @requires $filter
 * @requires api
 * @requires modal
 * @requires $interpolate
 * @requires $modal
 *
 * @description Confirm Service is responsible for displaying user prompts for content authoring.
 */
ConfirmDirtyService.$inject = ['$window', '$q', '$filter', 'api', 'modal', 'gettextCatalog',
    '$interpolate', '$modal'];
export function ConfirmDirtyService($window, $q, $filter, api, modal, gettextCatalog, $interpolate, $modal) {
    /**
     * Will ask for user confirmation for user confirmation if there are some changes which are not saved.
     * - Detecting changes via $scope.dirty - it's up to the controller to set it.
     */
    this.setupWindow = function setupWindow($scope) {
        $window.onbeforeunload = function() {
            if ($scope.dirty) {
                return gettextCatalog.getString(
                    'There are unsaved changes. If you navigate away, your changes will ' +
                    'be lost.');
            }

            $scope.$on('$destroy', () => {
                $window.onbeforeunload = angular.noop;
            });
        };
    };

    // Flag to set for instant checking if $scope is dirty for current item
    this.dirty = null;

    /**
     * Called from workqueue in case of unsaved changes.
     */
    this.reopen = function() {
        return modal.confirm(
            gettextCatalog.getString('There are some unsaved changes, go to the article to save changes?'),
            gettextCatalog.getString('Save changes?'),
            gettextCatalog.getString('Go-To'),
            gettextCatalog.getString('Ignore'),
            gettextCatalog.getString('Cancel')
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to loose his changes.
     */
    this.confirm = function confirm() {
        return modal.confirm(
            gettextCatalog.getString('There are some unsaved changes, do you want to save it now?'),
            gettextCatalog.getString('Save changes?'),
            gettextCatalog.getString('Save'),
            gettextCatalog.getString('Ignore'),
            gettextCatalog.getString('Cancel')
        );
    };

    /**
     * In case publish is triggered by quick buttons, show confirmation dialog
     */
    this.confirmQuickPublish = function() {
        return modal.confirm(
            gettextCatalog.getString('Do you want to publish the article?'),
            gettextCatalog.getString('Publish'),
            gettextCatalog.getString('Publish'),
            gettextCatalog.getString('Cancel')
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to save changes and publish.
     */
    this.confirmPublish = function() {
        return modal.confirm(
            gettextCatalog.getString('There are some unsaved changes, do you want to save and publish it now?'),
            gettextCatalog.getString('Save changes?'),
            gettextCatalog.getString('Save and publish'),
            gettextCatalog.getString('Cancel')
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to save changes and publish.
     */
    this.confirmSendTo = function confirmSendTo(action) {
        return modal.confirm(
            $interpolate(gettextCatalog.getString(
                'There are some unsaved changes, do you want to save and send it now?'
            ))({action: action}),
            gettextCatalog.getString('Save changes?'),
            $interpolate(gettextCatalog.getString('Save and send'))({action: action}),
            gettextCatalog.getString('Cancel')
        );
    };

    this.confirmSaveWork = function confirmSavework(msg) {
        return modal.confirm(
            $interpolate(
                gettextCatalog.getString(
                    'Configuration has changed. {{ message }} Would you like to save the story to your workspace?'
                )
            )({message: msg})
        );
    };

    /**
     * Make user aware that an item was unlocked
     *
     * @param {string} userId Id of user who unlocked an item.
     * @param {string} headline Headline of item which is unlocked
     */
    this.unlock = function unlock(userId, headline) {
        api.find('users', userId).then((user) => {
            var itemHeading = headline ? 'Item <b>' + headline + '</b>' : 'This item';
            var msg = gettext(itemHeading + ' was unlocked by <b>' + $filter('username')(user) + '</b>.');

            return modal.confirm(msg, gettextCatalog.getString('Item Unlocked'), gettextCatalog.getString('OK'), false);
        });
    };

    /**
     * Make user aware that an item was locked
     *
     * @param {string} userId Id of user who locked an item.
     */
    this.lock = function lock(userId) {
        api.find('users', userId).then((user) => {
            var msg = gettextCatalog.getString('This item was locked by <b>' + $filter('username')(user) + '</b>.');

            return modal.confirm(msg, gettextCatalog.getString('Item locked'), gettext('OK'), false);
        });
    };

    /**
     * @ngdoc method
     * @name confirm#confirmFeatureMedia
     * @public
     * @returns {promise}
     * @description Prompts the user to add the associated media to the Update.
     * @param {Object} item
     */
    this.confirmFeatureMedia = function(item) {
        let defered = $q.defer();

        $modal.open({
            templateUrl: 'scripts/apps/authoring/views/confirm-media-associated.html',
            controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                $scope.item = item;

                $scope.useMedia = function() {
                    defered.resolve($scope.item);
                    $modalInstance.close();
                };

                $scope.cancel = function() {
                    defered.reject(false);
                    $modalInstance.dismiss();
                };

                $scope.publishWithoutMedia = function() {
                    defered.resolve({});
                    $modalInstance.dismiss();
                };
            }]
        });


        return defered.promise;
    };
}
