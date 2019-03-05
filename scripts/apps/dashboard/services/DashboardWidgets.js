import _ from 'lodash';

export function DashboardWidgets() {
    var privateWidgets = {};

    this.addWidget = function(id, widget, debug) {
        privateWidgets[id] = _.extend({_id: id}, widget);
    };

    this.$get = function() {
        return _.values(privateWidgets);
    };
}
