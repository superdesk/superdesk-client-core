ContentProfilesController.$inject = ['$scope', 'notify', 'content', 'modal', '$q'];
export function ContentProfilesController($scope, notify, content, modal, $q) {
    var self = this;

    // creating will be true while the modal for creating a new content
    // profile is visible.
    $scope.creating = false;

    // editing will hold data about the content profile being edited, as well
    // as the bind to the editing form. If no profile is being edited, it will
    // be null.
    $scope.editing = null;

    /**
     * @description Refreshes the list of content profiles by fetching them.
     * @returns {Promise}
     * @private
     */
    function refreshList() {
        return content.getTypes(true).then((types) => {
            self.items = types;
        });
    }

    /**
     * @description Reports that an error has occurred.
     * @private
     */
    function reportError(resp) {
        notify.error('Operation failed (check console for response).');
        console.error(resp);
        return $q.reject(resp);
    }

    /**
     * @description Middle-ware that checks an error response to verify whether
     * it is a duplication error.
     * @param {Function} next The function to be called when error is not a
     * duplication error.
     * @private
     */
    function uniqueError(next) {
        return function(resp) {
            if (angular.isObject(resp) &&
                angular.isObject(resp.data) &&
                angular.isObject(resp.data._issues) &&
                angular.isObject(resp.data._issues.label) &&
                resp.data._issues.label.unique) {
                notify.error(self.duplicateErrorTxt);
                return $q.reject(resp);
            }
            return next(resp);
        };
    }

    this.duplicateErrorTxt = gettext('A content profile with this name already exists.');

    /**
     * @description Toggles the visibility of the creation modal.
     */
    this.toggleCreate = function() {
        $scope.new = {};
        $scope.creating = !$scope.creating;
    };

    /**
     * @description Toggles the visibility of the profile editing modal.
     * @param {Object} p the content profile being edited.
     */
    this.toggleEdit = function(p) {
        $scope.editing = angular.isObject(p) ? {
            form: _.cloneDeep(p),
            original: p
        } : null;
    };

    /**
     * @description Creates a new content profile.
     */
    this.save = function() {
        var onSuccess = function(resp) {
            refreshList();
            self.toggleCreate();
            return resp;
        };

        content.createProfile($scope.new)
            .then(onSuccess, uniqueError(reportError))
            .then(this.toggleEdit);
    };

    /**
     * @description Commits the changes made in the editing form for a profile
     * to the server.
     */
    this.update = function() {
        var e = $scope.editing;
        var diff = {};

        Object.keys(e.form).forEach((k) => {
            if (!_.isEqual(e.form[k], e.original[k])) {
                diff[k] = e.form[k];
            }
        });

        content.updateProfile(e.original, diff)
            .then(refreshList, reportError)
            .then(this.toggleEdit.bind(this, null));
    };

    /**
     * @description Queries the user for confirmation and deletes the content profile.
     */
    this.delete = function(item) {
        modal.confirm('Are you sure you want to delete this profile?').then(() => {
            content.removeProfile(item)
                .then(refreshList, reportError)
                .then(this.toggleEdit.bind(this, null));
        });
    };

    refreshList();
}
