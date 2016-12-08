
angular.module('ansa.semantics', ['superdesk.apps.authoring.widgets'])
    .config(['authoringWidgetsProvider', (authoringWidgetsProvider) => {
        authoringWidgetsProvider.widget('ansa-semantics', {
            label: 'Semantics',
            icon: 'related',
            template: 'scripts/apps/widgets/ansa-semantics-widget/ansa-semantics.widget.html',
            order: 7,
            side: 'right',
            display: {authoring: true},
            configurable: false
        })
    }]);
