
describe('ingest', () => {
    describe('registering activities in superdesk.apps.ingest module', () => {
        beforeEach(window.module('superdesk.apps.ingest'));
        beforeEach(window.module('superdesk.apps.searchProviders'));

        describe('the "archive" activity', () => {
            var activity;

            beforeEach(inject((superdesk) => {
                activity = superdesk.activities.archive;
                if (angular.isUndefined(activity)) {
                    fail('Activity "archive" is not registered.');
                }
            }));

            it('is allowed if the current desk is not "personal"', () => {
                var extraCondition = activity.additionalCondition,
                    fakeDesks;

                // get the function that checks the additional conditions
                extraCondition = extraCondition[extraCondition.length - 1];
                fakeDesks = {
                    getCurrentDeskId: function() {
                        return '1234';
                    },
                };

                expect(extraCondition(fakeDesks)).toBe(true);
            });

            it('is not allowed if the current desk is "personal"', () => {
                var extraCondition = activity.additionalCondition,
                    fakeDesks;

                // get the function that checks the additional conditions
                extraCondition = extraCondition[extraCondition.length - 1];
                fakeDesks = {
                    getCurrentDeskId: function() {
                        return null;
                    },
                };

                expect(extraCondition(fakeDesks)).toBe(false);
            });
        });
    });
});
