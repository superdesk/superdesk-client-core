ContentProfilesController.$inject = ['$scope', '$location', 'notify', 'content', 'modal', '$q', 'config'];
export function ContentProfilesController($scope, $location, notify, content, modal, $q, config) {
    var self = this;

    // creating will be true while the modal for creating a new content
    // profile is visible.
    $scope.creating = false;

    // editing will hold data about the content profile being edited, as well
    // as the bind to the editing form. If no profile is being edited, it will
    // be null.
    $scope.editing = null;

    // if true, only active Content Profiles will be shown
    // can be changed with a button
    $scope.active_only = true;

    // required for being able to mark the form as dirty and enable the save button
    // after saving content profile widgets config
    $scope.setNgForm = (ngForm) => {
        $scope.ngForm = ngForm;
    };

    $scope.saveContentProfileWidgetsConfig = (nextWidgets) => {
        $scope.editing.form.widgets = nextWidgets;
        $scope.$applyAsync(() => {
            $scope.ngForm.$dirty = true;
        });
    };

    $scope.withEditor3 = config.features.editor3;

    /**
     * @description Refreshes the list of content profiles by fetching them.
     * @returns {Promise}
     * @private
     */
    function refreshList(callEditActive) {
        return content.getTypes(true).then((types) => {
            self.items = types;
            if (callEditActive) {
                editActive();
            }
        });
    }

    /**
     * @description Start editing active profile
     * @private
     */
    function editActive() {
        $scope.editing = null;

        if ($location.search()._id) {
            const active = self.items.find((p) => p._id === $location.search()._id);

            if (active) {
                $scope.editing = {
                    form: _.cloneDeep(active),
                    original: active,
                };

                content.getTypeMetadata(active._id).then((type) => {
                    $scope.editing = {
                        form: _.cloneDeep(type),
                        original: _.cloneDeep(type),
                    };
                });
            }
        }
    }

    /**
     * @description Reports that an error has occurred.
     * @private
     */
    function reportError(resp) {
        let message = _.get(resp, 'data._issues["validator exception"]') || '';

        notify.error(`Operation failed ${message} (check console for response).`);
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
        $location.search({_id: p ? p._id : null});
        $scope.$applyAsync(editActive);
    };

    /**
     * @description Creates a new content profile.
     */
    this.save = function() {
        var onSuccess = function(resp) {
            refreshList(true);
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
            .then(refreshList.bind(this, false), reportError)
            .then(this.toggleEdit.bind(this, null));
    };

    /**
     * @description Queries the user for confirmation and deletes the content profile.
     */
    this.delete = function(item) {
        modal.confirm('Are you sure you want to delete this profile?').then(() => {
            content.removeProfile(item)
                .then(refreshList.bind(this, false), reportError)
                .then(this.toggleEdit.bind(this, null));
        });
    };

    refreshList(false);
}
