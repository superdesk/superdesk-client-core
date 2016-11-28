ConfirmDirtyService.$inject = ['$window', '$q', '$filter', 'api', 'modal', 'gettextCatalog', '$interpolate'];
export function ConfirmDirtyService($window, $q, $filter, api, modal, gettextCatalog, $interpolate) {
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

            $scope.$on('$destroy', function() {
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
            gettextCatalog.getString('There are some unsaved changes, re-open the article to save changes?'),
            gettextCatalog.getString('Save changes?'),
            gettextCatalog.getString('Re-Open'),
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
     * In case $scope is dirty ask user if he want's to save changes and publish.
     */
    this.confirmPublish = function confirmPublish(action) {
        return modal.confirm(
            $interpolate(gettextCatalog.getString(
                'There are some unsaved changes, do you want to save and publish it now?'
            ))({action: action}),
            gettextCatalog.getString('Save changes?'),
            $interpolate(gettextCatalog.getString('Save and publish'))({action: action}),
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
     * If there are spelling errors ask the user that if the user wants to save changes or not.
     */
    this.confirmSpellcheck = function(spellingErrors) {
        if (spellingErrors === 0) {
            return $q.resolve();
        }
        var mistakes = spellingErrors > 1 ? 'mistakes' : 'mistake';
        var confirmMessage = 'You have {{ spellingErrors }} spelling {{ mistakes }}. ' +
            'Are you sure you want to continue?';
        return modal.confirm($interpolate(gettextCatalog.getString(confirmMessage))({
            message: spellingErrors, mistakes: mistakes}));
    };

    /**
     * Make user aware that an item was unlocked
     *
     * @param {string} userId Id of user who unlocked an item.
     * @param {string} headline Headline of item which is unlocked
     */
    this.unlock = function unlock(userId, headline) {
        api.find('users', userId).then(function(user) {
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
        api.find('users', userId).then(function(user) {
            var msg = gettextCatalog.getString('This item was locked by <b>' + $filter('username')(user) + '</b>.');
            return modal.confirm(msg, gettextCatalog.getString('Item locked'), gettext('OK'), false);
        });
    };
}
