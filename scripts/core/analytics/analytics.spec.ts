import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('analytics', () => {
    beforeEach(window.module('superdesk.core.analytics'));
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            analytics: {piwik: {url: undefined}, ga: {id: undefined}},
        };

        Object.assign(appConfig, testConfig);
    });

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
