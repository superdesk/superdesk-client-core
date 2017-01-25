angular.module('superdesk.apps.aggregate.widgets', ['superdesk.apps.aggregate', 'superdesk.apps.dashboard.widgets'])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('aggregate', {
            label: 'Monitoring',
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
            description: 'This widget allows you to create literally any content view you may need in Superdesk,' +
                    ' be it production or ingest. All you need is to select a desk, its stages or a saved search.' +
                    ' Name your view once you are done. Enjoy!',
            custom: true
        });
    }]);
