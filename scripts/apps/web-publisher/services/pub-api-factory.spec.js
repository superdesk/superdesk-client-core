fdescribe('pubapi', () => {
    const RESOURCE_URL = 'http://example.com/api/v1/tenants';
    const ITEM_URL = RESOURCE_URL + '/123';
    const ITEM_SELF_HREF = '/api/v1/tenants/123';

    beforeEach(window.module('superdesk.web_publisher'));

    beforeEach(inject(config => {
        config.publisher = {
            server: 'http://example.com',
            base: '/api/v1'
        };
    }));

    it('it can query', inject((pubapi, $httpBackend) => {
        var data;
        $httpBackend.expectGET(RESOURCE_URL)
            .respond(200, {_embedded: {_items: [{_id: 'foo'}, {_id: 'bar'}]}});
        pubapi.query('tenants').then(_data => data = _data);
        $httpBackend.flush();
        expect(data.length).toBe(2);
    }));

    it('it can handle errors', inject((pubapi, $httpBackend) => {
        $httpBackend.expectGET(RESOURCE_URL)
            .respond(500);
        let success = jasmine.createSpy('ok');
        let error = jasmine.createSpy('error');
        pubapi.query('tenants').then(success, error);
        $httpBackend.flush();
        expect(success).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalled();
    }));

    it('it can create new resource', inject((pubapi, $httpBackend) => {
        var item = {name: 'foo'};
        $httpBackend.expectPOST(RESOURCE_URL)
            .respond(201, {id: '123'});
        pubapi.save('tenants', item);
        $httpBackend.flush();
        expect(item.id).toBe('123');
    }));

    it('it can update an item', inject((pubapi, $httpBackend) => {
        var item = {id: 'foo', _links: {self: {href: ITEM_SELF_HREF}}};
        var updates = {name: 'foo'};
        $httpBackend.expectPATCH(ITEM_URL, updates)
            .respond(200, {updated: 'now'});
        pubapi.save('tenants', item, updates);
        $httpBackend.flush();
        expect(item.updated).toBe('now');
    }));
});
