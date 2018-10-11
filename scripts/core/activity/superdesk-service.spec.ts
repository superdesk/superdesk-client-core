describe('Superdesk service', () => {
    var provider;
    var intent = {action: 'testAction', type: 'testType', id: 'testId'};
    var testWidget = {testData: 123};
    var testPane = {testData: 123};
    var testActivity = {
        label: 'test',
        controller: function() {
            return 'test';
        },
        filters: [intent],
        category: 'superdesk.core.menu.main',
    };

    angular.module('superdesk.core.activity.test', ['superdesk.core.activity'])
        .config((superdeskProvider) => {
            provider = superdeskProvider;
            provider.widget('testWidget', testWidget);
            provider.pane('testPane', testPane);

            provider.activity('testActivity', testActivity);

            provider.activity('missingFeatureActivity', {
                category: superdeskProvider.MENU_MAIN,
                features: {missing: 1},
                filters: [{action: 'test', type: 'features'}],
            });

            provider.activity('missingPrivilegeActivity', {
                category: superdeskProvider.MENU_MAIN,
                privileges: {missing: 1},
                filters: [{action: 'test', type: 'privileges'}],
            });
        });

    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.activity.test'));
    beforeEach(window.module('superdesk.mocks'));

    it('exists', inject((superdesk) => {
        expect(superdesk).toBeDefined();
    }));

    it('can add widgets', inject((superdesk) => {
        expect(superdesk.widgets.testWidget.testData).toBe(testWidget.testData);
    }));

    it('can add panes', inject((superdesk) => {
        expect(superdesk.panes.testPane.testData).toBe(testPane.testData);
    }));

    it('can add activities', inject((superdesk) => {
        expect(superdesk.activities.testActivity.label).toBe(testActivity.label);
    }));

    it('can run activities', inject(($rootScope, superdesk, activityService) => {
        var result = null;

        activityService.start(superdesk.activities.testActivity)
            .then((res) => {
                result = res;
            });

        $rootScope.$digest();

        expect(result).toBe('test');
    }));

    it('can run activities by intent', inject(($rootScope, superdesk) => {
        var successResult = null;
        var failureResult = null;

        superdesk.intent('testAction', 'testType', 'testData')
            .then((result) => {
                successResult = result;
            });
        superdesk.intent('testAction2', 'testType2', 'testData2')
            .then(null, (result) => {
                failureResult = result;
            });

        $rootScope.$digest();

        expect(successResult).toBe('test');
        expect(failureResult).toBe(undefined);
    }));

    it('can run activities by intent provided with an id', inject(($rootScope, superdesk) => {
        var successResult = null;
        var failureResult = null;

        superdesk.intent('testAction', 'testType', 'testData', 'testId')
            .then((result) => {
                successResult = result;
            });
        superdesk.intent('testAction2', 'testType2', 'testData2', 'testId2')
            .then(null, (result) => {
                failureResult = result;
            });

        $rootScope.$digest();

        expect(successResult).toBe('test');
        expect(failureResult).toBe(undefined);
    }));

    it('can find activities', inject((superdesk) => {
        var success = superdesk.findActivities(intent);
        var failure = superdesk.findActivities({type: 'testType2', action: 'testAction2', id: 'testId2'});

        expect(success.length).toBe(1);
        expect(success[0].label).toBe('test');
        expect(failure.length).toBe(0);
    }));

    it('can check features required by activity', inject((superdesk, features) => {
        var list = superdesk.findActivities({type: 'features', action: 'test'});

        expect(list.length).toBe(0);
    }));

    it('can filter activities based on privileges', inject((superdesk, privileges) => {
        var list = superdesk.findActivities({type: 'privileges', action: 'test'});

        expect(list.length).toBe(0);

        privileges.setUserPrivileges({missing: 1});
        list = superdesk.findActivities({type: 'privileges', action: 'test'});
        expect(list.length).toBe(1);
    }));

    it('can get main menu and filter out based on features/permissions',
        inject((superdesk, $rootScope, privileges, $q) => {
            privileges.loaded = $q.when();

            var menu;

            superdesk.getMenu(superdesk.MENU_MAIN).then((_menu) => {
                menu = _menu;
            });

            $rootScope.$digest();
            expect(menu.length).toBe(1);
        }));

    it('can get link for given activity', inject((activityService) => {
        var routeActivity = {href: '/test/:_id'};

        expect(activityService.getLink(routeActivity, {})).toBe(null);
        expect(activityService.getLink(routeActivity, {_id: 1})).toBe('/test/1');
    }));
});
