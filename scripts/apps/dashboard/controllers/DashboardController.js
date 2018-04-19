DashboardController.$inject = ['$scope', 'desks', 'dashboardWidgets', 'api', 'session', 'workspaces',
    'modal', 'gettext', 'privileges', 'pageTitle'];
export function DashboardController($scope, desks, dashboardWidgets, api, session, workspaces,
    modal, gettext, privileges, pageTitle) {
    var self = this;

    $scope.edited = null;
    $scope.workspaces = workspaces;
    $scope.$watch('workspaces.active', setupWorkspace);
    workspaces.getActive();
    pageTitle.setUrl(gettext('Dashboard'));

    function setupWorkspace(workspace) {
        self.current = null;
        if (workspace) {
            // is the user allowed to configure widgets on this desk?
            $scope.configurable = workspaces.isCustom() || privileges.userHasPrivileges({desks: 1});
            // do this async so that it can clean up previous grid
            $scope.$applyAsync(() => {
                self.current = workspace;
                self.widgets = extendWidgets(workspace.widgets || []);
                self.availableWidgets = dashboardWidgets;
            });
        }
    }

    /**
     * Return the list of available widgets that can be added
     * to current dashboard
     *
     * @return {promise} list of widgets
     */
    function getAvailableWidgets(userWidgets) {
        return _.filter(dashboardWidgets,
            (widget) => widget.multiple || _.isNil(_.find(userWidgets, {_id: widget._id})));
    }

    /**
     * Add widgets to current dashboard
     *
     * @param {object} widget
     */
    this.addWidget = function(widget) {
        let w = widget;

        if (widget.multiple) {
            w = angular.copy(widget);
            w.multiple_id = 0;

            angular.forEach(this.widgets, (item) => {
                if (item._id === w._id && item.multiple_id >= w.multiple_id) {
                    w.multiple_id = item.multiple_id + 1;
                }
            });
        }

        w.active = true;

        this.widgets.push(w);
        this.selectWidget();
        this.save();
    };

    /*
     * If widget is not selected, opens single view of specific widget
     * @param {object} widget
     */
    this.selectWidget = function(widget) {
        if (!this.isSelected(widget)) {
            this.selectedWidget = widget || null;
        }
    };

    /*
     * Checks if widget is already selected
     * @param {object} widget
     * @returns {boolean}
     */
    this.isSelected = function(widget) {
        return widget && !_.find(getAvailableWidgets(this.widgets), widget);
    };

    function extendWidgets(currentWidgets) {
        return _.map(currentWidgets, (widget) => {
            var original = _.find(dashboardWidgets, {_id: widget._id});

            return angular.extend({}, original, widget);
        });
    }

    /**
     * Prepare the widget to be saved. Filter any non-required data.
     *
     * @return {promise} widget
     */
    function pickWidgets(widgets) {
        return _.map(widgets, (widget) =>
            _.pick(widget, [
                '_id',
                'configuration',
                'sizex',
                'sizey',
                'col',
                'row',
                'active',
                'multiple_id',
            ]));
    }

    /*
     * Saves current workspace
     */
    this.save = function() {
        this.edit = false;
        var diff = angular.extend({}, this.current);

        this.widgets = _.filter(this.widgets, {active: true});
        diff.widgets = pickWidgets(this.widgets);
        api.save('workspaces', this.current, diff);
    };

    /*
     * Confirms and deletes current workspace
     */
    this.delete = function() {
        modal.confirm(
            gettext('Are you sure you want to delete current workspace?')
        )
            .then(() => workspaces.delete(self.current));
    };

    /*
     * Enables editing current workspace
     */
    this.rename = function() {
        $scope.edited = angular.copy(self.current);
    };

    /*
     * Updates workspaces after editing
     */
    this.afterRename = function() {
        workspaces.getActive();
    };
}
