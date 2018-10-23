describe('widgets provider', () => {
    var dashboardWidgetsProvider;

    beforeEach(() => {
        angular.module('superdesk.apps.dashboard.widgets.tests', [])
            .config(['dashboardWidgetsProvider', function(_dashboardWidgetsProvider_) {
                dashboardWidgetsProvider = _dashboardWidgetsProvider_;
            }]);

        window.module('superdesk.apps.dashboard.widgets', 'superdesk.apps.dashboard.widgets.tests');

        // init the tests module to get the actual provider
        inject(() => { /* no-op */ });
    });

    beforeEach(() => {
        dashboardWidgetsProvider.addWidget('id', {label: 'first'}, 'true');
        dashboardWidgetsProvider.addWidget('id', {label: 'second'}, 'true');
    });

    it('is defined', inject((dashboardWidgets) => {
        expect(dashboardWidgets).not.toBe(undefined);
    }));

    it('can register widgets', inject((dashboardWidgets) => {
        expect(dashboardWidgets.length).toBe(1);
        expect(dashboardWidgets[0]._id).toBe('id');
        expect(dashboardWidgets[0].label).toBe('second');
    }));
});
