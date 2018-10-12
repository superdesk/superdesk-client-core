describe('analytics', () => {
    beforeEach(window.module('superdesk.core.analytics'));
    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            analytics: {piwik: {}, ga: {}},
        });
    }));

    it('can track activity', inject((analytics, $rootScope) => {
        spyOn(analytics, 'track');

        var activity = {
            _id: 'test',
            label: 'test',
        };

        // mimic route change event
        $rootScope.$broadcast('$routeChangeSuccess', activity);

        expect(analytics.track).toHaveBeenCalledWith(activity);
    }));
});
