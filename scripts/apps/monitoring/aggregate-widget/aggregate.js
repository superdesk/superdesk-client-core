angular.module('superdesk.apps.aggregate.widgets', ['superdesk.apps.aggregate', 'superdesk.apps.dashboard.widgets'])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('aggregate', {
            label: gettext('Monitor'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 3,
            sizex: 1,
            sizey: 2,
            classes: 'tabs modal--nested-fix',
            thumbnail: 'scripts/apps/monitoring/aggregate-widget/thumbnail.svg',
            template: 'scripts/apps/monitoring/aggregate-widget/aggregate-widget.html',
            configurationTemplate: 'scripts/apps/monitoring/aggregate-widget/configuration.html',
            description: 'Set up different monitors to follow any topics from ingest or production, desk outputs or ' +
                    'any part of the workflow. All you need is to give it a sensible name, select a saved search or ' +
                    'desk or its workflow stages. Monitor anything, anywhere, anytime. You can have as many Monitor ' +
                    'widgets as you wish.',
            custom: true,
        });
    }]);
