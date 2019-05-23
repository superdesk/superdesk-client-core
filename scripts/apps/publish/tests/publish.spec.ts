
describe('publish queue', () => {
    var subscribers = {_items: [
        {
            _created: '2015-05-11T06:00:48+0000',
            _etag: '8d27862ca97a8741aaf8ac38f1de3605e085062c',
            _id: '555045901d41c80c5804501a',
            _updated: '2015-05-12T01:01:47+0000',
            destinations: [
                {
                    config: {
                        recipients: 'test@aap.com.au',
                    },
                    format: 'nitf',
                    delivery_type: 'email',
                    name: 'test',
                },
            ],
            is_active: true,
            name: 'test',
        },
    ]};

    var providers = [
        {
            _id: '123',
            name: 'Test Provider',
        },
    ];

    var contenttypes = [
        {
            qcode: 'text',
            name: 'text',
        },
    ];

    var publishQueue = {_items: [
        {
            _created: '2015-05-15T06:27:13+0000',
            _etag: 'd18bf9f762b03815acc189fdcef633bf67f8e222',
            _id: '555591c11d41c830e91b1f9f',
            _updated: '2015-05-19T04:18:23+0000',
            completed_at: '2015-05-19T04:18:23+0000',
            content_type: 'text',
            destination: {
                config: {
                    recipients: 'test@aap.com.au',
                },
                format: 'nitf',
                delivery_type: 'email',
                name: 'test',
            },
            headline: 'RL:Souths win but Dugan stars in NRL',
            item_id: 'tag:localhost:2015:a613f9b5-c7c4-4980-a3e8-0a90586ba59e',
            publish_schedule: null,
            published_seq_num: 11,
            publishing_action: 'published',
            state: 'success',
            subscriber_id: '555045901d41c80c5804501a',
            transmit_started_at: '2015-05-19T04:18:23+0000',
            unique_name: '#55861',
        },
        {
            _created: '2015-05-19T05:13:29+0000',
            _etag: '88602d040ee9e67feb25d928d18325d2f8c24830',
            _id: '555ac6791d41c8105b514cf0',
            _updated: '2015-05-19T05:13:34+0000',
            completed_at: '2015-05-19T05:13:34+0000',
            content_type: 'text',
            destination: {
                config: {
                    recipients: 'test@aap.com.au',
                },
                format: 'nitf',
                delivery_type: 'email',
                name: 'test',
            },
            headline: 'Angle Park Greyhound NSW TAB Divs 1-8 Monday',
            item_id: 'tag:localhost:2015:15982dd3-0ab2-4da1-b2a2-b8f322e8a612',
            publish_schedule: null,
            published_seq_num: 15,
            publishing_action: 'corrected',
            state: 'success',
            subscriber_id: '555045901d41c80c5804501a',
            transmit_started_at: '2015-05-19T05:13:34+0000',
            unique_name: '#55860',
            ingest_provider: '123',
        },
        {
            _created: '2015-05-19T08:56:43+0000',
            _etag: '3cd58463412d08d2d776a931f04f997282025e7a',
            _id: '555afacb1d41c817984405b5',
            _updated: '2015-05-19T08:56:49+0000',
            completed_at: '2015-05-19T08:56:49+0000',
            content_type: 'text',
            destination: {
                config: {
                    recipients: 'test@aap.com.au',
                },
                format: 'nitf',
                delivery_type: 'email',
                name: 'test',
            },
            headline: 'NSW:Man quizzed over suspicious Sydney death',
            item_id: 'tag:localhost:2015:7466da05-56d2-47d4-a401-b79ed2af08a2',
            publish_schedule: null,
            published_seq_num: 16,
            publishing_action: 'published',
            state: 'success',
            subscriber_id: '555045901d41c80c5804501a',
            transmit_started_at: '2015-05-19T08:56:49+0000',
            unique_name: '#57537',
        },
    ],
    _meta: {
        total: 3,
    }};

    var $scope;

    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.content_filters'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.ingest'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));

    beforeEach(inject(($rootScope, $controller, subscribersService, $q, api, ingestSources, vocabularies) => {
        spyOn(subscribersService, 'fetchSubscribers').and.returnValue($q.when(subscribers));
        spyOn(ingestSources, 'fetchAllIngestProviders').and.returnValue($q.when(providers));
        spyOn(vocabularies, 'getVocabulary').and.returnValue($q.when(contenttypes));
        spyOn(api.publish_queue, 'query').and.returnValue($q.when(publishQueue));
        $scope = $rootScope.$new();
        $controller('publishQueueCtrl',
            {
                $scope: $scope,
                subscribersService: subscribersService,
                ingestSouces: ingestSources,
                $q: $q,
                api: api,
            },
        );
    }));

    it('can load items from publish_queue', inject(($rootScope) => {
        $rootScope.$digest();
        expect($scope.publish_queue.length).toBe(3);
        _.each($scope.publish_queue, (item) => {
            expect(item.selected).toBe(false);
        });
        expect($scope.showResendBtn).toBe(false);
        expect($scope.showCancelBtn).toBe(false);
    }));

    it('can select multiple queue items', inject(($rootScope) => {
        $rootScope.$digest();
        expect($scope.publish_queue.length).toBe(3);
        $scope.publish_queue[0].selected = true;
        $scope.selectQueuedItem($scope.publish_queue[0]);
        expect($scope.multiSelectCount).toBe(1);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
        $scope.publish_queue[1].selected = true;
        $scope.selectQueuedItem($scope.publish_queue[1]);
        expect($scope.multiSelectCount).toBe(2);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
    }));

    it('can deselect queue items', inject(($rootScope) => {
        $rootScope.$digest();
        expect($scope.publish_queue.length).toBe(3);
        $scope.publish_queue[0].selected = true;
        $scope.publish_queue[1].selected = true;
        $scope.selectQueuedItem($scope.publish_queue[0]);
        $scope.selectQueuedItem($scope.publish_queue[1]);
        expect($scope.multiSelectCount).toBe(2);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
        $scope.publish_queue[1].selected = false;
        $scope.selectQueuedItem($scope.publish_queue[1]);
        expect($scope.multiSelectCount).toBe(1);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
        $scope.publish_queue[0].selected = false;
        $scope.selectQueuedItem($scope.publish_queue[0]);
        expect($scope.multiSelectCount).toBe(0);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
    }));

    it('can deselect all queue items', inject(($rootScope) => {
        $rootScope.$digest();
        expect($scope.publish_queue.length).toBe(3);
        $scope.publish_queue[0].selected = true;
        $scope.publish_queue[1].selected = true;
        $scope.selectQueuedItem($scope.publish_queue[0]);
        $scope.selectQueuedItem($scope.publish_queue[1]);
        expect($scope.multiSelectCount).toBe(2);
        expect($scope.showResendBtn).toBe(true);
        expect($scope.showCancelBtn).toBe(false);
        $scope.publish_queue[1].selected = false;
        $scope.selectQueuedItem($scope.publish_queue[1]);
        $scope.cancelSelection();
        expect($scope.multiSelectCount).toBe(0);
    }));

    it('sets the selected filter subscriber', inject(() => {
        var subscriberValue = {foo: 'bar'};

        $scope.selectedFilterSubscriber = null;
        $scope.filterPublishQueue(subscriberValue, 'subscriber');
        expect($scope.selectedFilterSubscriber).toEqual(subscriberValue);
    }));

    it('sets the selected filter ingest provider', inject(() => {
        var value = {foo: 'bar'};

        $scope.selectedFilterIngestProvider = null;
        $scope.filterPublishQueue(value, 'ingest_provider');
        expect($scope.selectedFilterIngestProvider).toEqual(value);
    }));

    it('sets the selected filter status', inject(() => {
        var statusValue = 'success';

        $scope.selectedFilterStatus = null;
        $scope.filterPublishQueue(statusValue, 'status');
        expect($scope.selectedFilterStatus).toEqual(statusValue);
    }));

    it('sets the selected filter type', inject(() => {
        var statusValue = 'success';

        $scope.selectedFilterStatus = null;
        $scope.filterPublishQueue(statusValue, 'type');
        expect($scope.selectedFilterContentType).toEqual(statusValue);
    }));

    it('can search by headline', inject(($rootScope) => {
        $scope.search(publishQueue._items[0].headline);
        $scope.$digest();
        expect($scope.publish_queue[0].headline).toEqual(publishQueue._items[0].headline);
    }));

    it('can perform word(s) search on headline', inject(($rootScope) => {
        $scope.search('dugan stars');
        $scope.$digest();
        var reQuery = new RegExp($scope.searchQuery, 'i');

        expect($scope.publish_queue[0].headline).toMatch(reQuery);
    }));

    it('can search by unique name', inject(($rootScope) => {
        $scope.search(publishQueue._items[0].unique_name);
        $scope.$digest();
        expect($scope.publish_queue[0].unique_name).toEqual(publishQueue._items[0].unique_name);
    }));

    it('can resend single publish queue item', inject(($rootScope, api, $q) => {
        $rootScope.$digest();
        expect($scope.publish_queue.length).toBe(3);
        spyOn(api.publish_queue, 'save').and.callFake(() => {
            publishQueue._items.push($scope.buildNewSchedule($scope.publish_queue[0]));
            return $q.when();
        });
        $scope.scheduleToSend($scope.publish_queue[0]);
        expect($scope.publish_queue.length).toBe(4);
    }));

    it('can observe pagination and load page data', inject(($rootScope, api, $q) => {
        $scope.pageSize = 1;
        $scope.page = 2;

        var pagedPublishQueue = {_items: [publishQueue._items[1]], _meta: {total: 3}};

        api.publish_queue.query = jasmine.createSpy().and.returnValue($q.when(pagedPublishQueue));

        $scope.reload = jasmine.createSpy('reload');

        $scope.$digest();

        expect($scope.reload).toHaveBeenCalled();
        expect($scope.maxPage).toEqual(3);
        expect($scope.publish_queue[0]._id).toEqual(publishQueue._items[1]._id);
    }));
});

describe('subscriber filter', () => {
    const subscribers = [
        {name: 'test all', subscriber_type: 'all', is_active: true},
        {name: 'test wire', subscriber_type: 'wire', is_active: true},
        {name: 'digital', subscriber_type: 'digital', is_active: false},
    ];

    let subscribersByFilter = null;

    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(inject((_subscribersByFilter_) => {
        subscribersByFilter = _subscribersByFilter_;
    }));

    it('can get all active subscribers if no subscriber type', () => {
        const items = subscribersByFilter(subscribers, {subscriber_status: {value: true}});

        expect(items.length).toBe(2);
    });

    it('can get all subscribers buy name test', () => {
        const items = subscribersByFilter(subscribers, {name: 'test'});

        expect(items.length).toBe(2);
    });

    it('can get all subscribers by subscriber type all', () => {
        const items = subscribersByFilter(subscribers, {subscriber_type: 'all'});

        expect(items.length).toBe(1);
        expect(items[0].name).toBe('test all');
    });

    it('can get all subscribers by subscriber type digital', () => {
        const items = subscribersByFilter(subscribers, {subscriber_type: 'digital'});

        expect(items.length).toBe(1);
        expect(items[0].name).toBe('digital');
    });

    it('can get all subscribers by subscriber type wire', () => {
        const items = subscribersByFilter(subscribers, {subscriber_type: 'wire'});

        expect(items.length).toBe(1);
        expect(items[0].name).toBe('test wire');
    });

    it('can get all subscribers', () => {
        const items = subscribersByFilter(subscribers, {subscriber_type: ''});

        expect(items.length).toBe(subscribers.length);
    });
});
