/**
 * @ngdoc controller
 * @module superdesk.apps.content_filters
 * @name ContentFiltersConfigCtrl
 * @description Main controller for the Content Filters page under the system
 * settings section.
 */
ContentFiltersConfigController.$inject = [];
export function ContentFiltersConfigController() {
    var self = this;

    self.TEMPLATES_DIR = 'scripts/apps/content-filters/views';
    self.activeTab = 'filters';

    /**
    * Sets the active tab name to the given value.
    *
    * @method changeTab
    * @param {string} newTabName - name of the new active tab
    */
    self.changeTab = function(newTabName) {
        self.activeTab = newTabName;
    };
}
