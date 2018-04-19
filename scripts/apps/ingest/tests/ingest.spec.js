
describe('ingest', () => {
    describe('send service', () => {
        beforeEach(window.module('superdesk.apps.ingest.send'));
        beforeEach(window.module('superdesk.templates-cache'));
        beforeEach(window.module('superdesk.apps.searchProviders'));

        beforeEach(inject((notify) => {
            spyOn(notify, 'success').and.returnValue(null);
            spyOn(notify, 'error').and.returnValue(null);
        }));

        it('can send an ingest item', inject((send, api, $q, $rootScope) => {
            spyOn(api, 'save').and.returnValue($q.when({_created: 'now'}));
            var item = {_id: '1', _type: 'ingest'};

            expect(send.one(item).then).toBeDefined();
            $rootScope.$digest();

            expect(api.save).toHaveBeenCalled();
            expect(item.archived).toBe('now');
        }));

        it('can send an externalsource item', inject((send, api, $q, $rootScope, notify) => {
            spyOn(api, 'save').and.returnValue($q.when({_created: 'now'}));
            var item = {_id: '1', _type: 'externalsource'};

            expect(send.one(item).then).toBeDefined();
            $rootScope.$digest();

            expect(api.save).toHaveBeenCalled();
            expect(notify.success.calls.count()).toEqual(1);
        }));

        it('can send multiple items', inject((send, api, $q, $rootScope) => {
            spyOn(api, 'save').and.returnValue($q.when({}));
            var items = [{_id: 1, _type: 'ingest'}, {_id: 2, _type: 'ingest'}];

            send.all(items);
            $rootScope.$digest();

            expect(api.save.calls.count()).toBe(2);
        }));

        it('can send an item as', inject((send, api, $q, $rootScope) => {
            var item = {_id: 1, _type: 'ingest'},
                config = {
                    desk: 'desk1',
                    stage: 'stage1',
                    macro: 'macro1',
                };

            spyOn(api, 'save').and.returnValue($q.when({_created: 'now'}));

            expect(send.oneAs(item, config).then).toBeDefined();
            $rootScope.$digest();

            expect(api.save).toHaveBeenCalled();
            expect(item.archived).toBe('now');
        }));

        it('can send an item as for externalsourceTo action', inject((send, api, $q, $rootScope, notify) => {
            var item = {
                    _id: 1,
                    guid: 1,
                    _type: 'externalsource',
                    fetch_endpoint: 'search_providers_proxy',
                    ingest_provider: '123',
                },
                config = {
                    desk: 'desk1',
                    stage: 'stage1',
                    macro: 'macro1',
                },
                action = 'externalsourceTo';

            spyOn(api, 'save').and.returnValue($q.when({_created: 'now'}));

            expect(send.oneAs(item, config, action).then).toBeDefined();
            $rootScope.$digest();

            expect(api.save).toHaveBeenCalled();
            expect(notify.success.calls.count()).toEqual(1);
        }));

        it('can send multiple items as', inject((send, api, $q, $rootScope) => {
            spyOn(api, 'save').and.returnValue($q.when({_id: 'foo', _created: 'now'}));

            var items = [{_id: 1, _type: 'ingest'}, {_id: 2, _type: 'ingest'}];

            expect(send.config).toBe(null);

            var archives;

            send.allAs(items).then((_archives) => {
                archives = _archives;
            });

            send.config.resolve({desk: 'desk1', stage: 'stage1'});
            $rootScope.$digest();

            expect(api.save.calls.count()).toBe(2);
            expect(archives.length).toBe(2);
            expect(items[0].archived).toBe('now');
        }));
    });

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
