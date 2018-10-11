import {ExternalSourceController} from '../controllers/ExternalSourceController';

describe('externalSourceController', () => {
    const externalSourceData = {
        item: {
            guid: '20170310001299871860',
            fetch_endpoint: 'search_providers_proxy',
            ingest_provider: '58bf76e71d41c8aa1e9f8e91',
        },
    };

    const userDesks = [
        {_id: '58bf87211d41c8aa21c572487', name: 'Sports'},
        {_id: '70db87211d41c8aa21c573468', name: 'Finance'},
        {_id: '69ca87211d41c8aa21c572359', name: 'News'},
    ];

    beforeEach(() => {
        window.module(($provide) => {
            $provide.value('data', angular.copy(externalSourceData));
        });
    });

    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.mocks'));

    beforeEach(inject((desks, notify, session) => {
        desks.userDesks = userDesks;
        session.identity = {desk: null};
        spyOn(notify, 'success').and.returnValue(null);
        spyOn(notify, 'error').and.returnValue(null);
    }));

    it('can export to active desk', inject((api, data, desks, notify, gettext, $rootScope, $q) => {
        let result = null;

        desks.activeDeskId = userDesks[2]._id;
        spyOn(api, 'save').and.returnValue($q.when({}));

        ExternalSourceController(api, data, desks, notify, gettext)
            .then((_result) => {
                result = _result;
            });

        $rootScope.$digest();
        expect(result).toEqual({actioning: {externalsource: false}});
        expect(api.save).toHaveBeenCalledWith(
            externalSourceData.item.fetch_endpoint,
            {
                guid: externalSourceData.item.guid,
                desk: userDesks[2]._id,
            },
            null, null, {repo: externalSourceData.item.ingest_provider}
        );

        expect(notify.success.calls.count()).toEqual(1);
    }));

    it('can export to default desk', inject((api, data, desks, notify, gettext, session, $rootScope, $q) => {
        session.identity.desk = userDesks[1]._id;
        spyOn(api, 'save').and.returnValue($q.when({}));

        ExternalSourceController(api, data, desks, notify, gettext);

        $rootScope.$digest();
        expect(api.save).toHaveBeenCalledWith(
            externalSourceData.item.fetch_endpoint,
            {
                guid: externalSourceData.item.guid,
                desk: userDesks[1]._id,
            },
            null, null, {repo: externalSourceData.item.ingest_provider}
        );
    }));

    it('can export to first user desk', inject((api, data, desks, notify, gettext, $rootScope, $q) => {
        spyOn(api, 'save').and.returnValue($q.when({}));

        ExternalSourceController(api, data, desks, notify, gettext);

        $rootScope.$digest();
        expect(api.save).toHaveBeenCalledWith(
            externalSourceData.item.fetch_endpoint,
            {
                guid: externalSourceData.item.guid,
                desk: userDesks[0]._id,
            },
            null, null, {repo: externalSourceData.item.ingest_provider}
        );
    }));

    it('can raise error', inject((api, data, desks, notify, gettext, $rootScope, $q) => {
        spyOn(api, 'save').and.returnValue($q.reject('Failed'));

        ExternalSourceController(api, data, desks, notify, gettext);

        $rootScope.$digest();
        expect(notify.error.calls.count()).toEqual(1);
    }));
});
