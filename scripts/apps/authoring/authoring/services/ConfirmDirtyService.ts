import {gettext} from 'core/utils';

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
ConfirmDirtyService.$inject = ['$window', '$q', '$filter', 'api', 'modal',
    '$interpolate', '$modal'];
export function ConfirmDirtyService($window, $q, $filter, api, modal, $interpolate, $modal) {
    /**
     * Will ask for user confirmation for user confirmation if there are some changes which are not saved.
     * - Detecting changes via $scope.dirty - it's up to the controller to set it.
     */
    this.setupWindow = function setupWindow($scope) {
        $window.onbeforeunload = function() {
            if ($scope.dirty) {
                return gettext('There are unsaved changes. If you navigate away, your changes will be lost.');
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
            gettext('There are some unsaved changes, go to the article to save changes?'),
            gettext('Save changes?'),
            gettext('Go-To'),
            gettext('Ignore'),
            gettext('Cancel'),
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to loose his changes.
     */
    this.confirm = function confirm() {
        return modal.confirm(
            gettext('There are some unsaved changes, do you want to save it now?'),
            gettext('Save changes?'),
            gettext('Save'),
            gettext('Ignore'),
            gettext('Cancel'),
        );
    };

    /**
     * In case publish is triggered by quick buttons, show confirmation dialog
     */
    this.confirmQuickPublish = function() {
        return modal.confirm(
            gettext('Do you want to publish the article?'),
            gettext('Publishing'),
            gettext('Publish'),
            gettext('Cancel'),
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to save changes and publish.
     */
    this.confirmPublish = function() {
        return modal.confirm(
            gettext('There are some unsaved changes, do you want to save and publish it now?'),
            gettext('Save changes?'),
            gettext('Save and publish'),
            gettext('Cancel'),
        );
    };

    /**
     * In case $scope is dirty ask user if he want's to save changes and publish.
     */
    this.confirmSendTo = function confirmSendTo(action) {
        return modal.confirm(
            gettext('There are some unsaved changes, do you want to save and send it now?'),
            gettext('Save changes?'),
            gettext('Save and send'),
            gettext('Cancel'),
        );
    };

    this.confirmSaveWork = function confirmSavework(message) {
        return modal.confirm(
            gettext(
                'Configuration has changed. {{message}} Would you like to save the story to your workspace?',
                {message},
            ),
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
            var username = $filter('username')(user);
            var msg = headline ?
                gettext(
                    'Item {{headline}} was unlocked by {{username}}.',
                    {headline: `<b>${headline}</b>`, username: `<b>${username}</b>`},
                )
                :
                gettext(
                    'This item was unlocked by {{username}}.',
                    {username: `<b>${username}</b>`},
                );

            return modal.confirm(msg, gettext('Item Unlocked'), gettext('OK'), false);
        });
    };

    /**
     * Make user aware that an item was locked
     *
     * @param {string} userId Id of user who locked an item.
     */
    this.lock = function lock(userId) {
        api.find('users', userId).then((user) => {
            var username = $filter('username')(user);
            var msg = gettext('This item was locked by {{username}}.', {username: `<b>${username}</b>`});

            return modal.confirm(msg, gettext('Item locked'), gettext('OK'), false);
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
        const defered = $q.defer();

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
            }],
        });

        return defered.promise;
    };
}
