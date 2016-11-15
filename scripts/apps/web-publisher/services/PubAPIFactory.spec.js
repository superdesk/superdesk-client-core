describe('pubapi', () => {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    const RESOURCE_URL = 'http://example.com/api/v1/tenants/';
=======
    const RESOURCE_URL = 'http://default.example.com/api/v1/tenants/';
>>>>>>> Added web publisher module
    const ITEM_URL = RESOURCE_URL + '123';

    beforeEach(window.module('superdesk.apps.web_publisher'));

<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    beforeEach(inject((config) => {
=======
    beforeEach(inject(config => {
>>>>>>> Added web publisher module
        config.publisher = {
            protocol: 'http',
            tenant: 'default',
            domain: 'example.com',
            base: 'api/v1'
        };
    }));

<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    it('can build a default tenant resource url', inject((pubapi) => {
        let url = pubapi.resourceURL('menus');

        expect(url).toBe('http://example.com/api/v1/menus/');
    }));

    it('can build a custom tenant resource url', inject((pubapi) => {
        pubapi.setTenant('custom');
        let url = pubapi.resourceURL('menus');

        expect(url).toBe('http://custom.example.com/api/v1/menus/');
    }));

    it('can query', inject((pubapi, $httpBackend) => {
        let data;

        $httpBackend.expectGET(RESOURCE_URL)
            .respond(200, {_embedded: {_items: [{_id: 'foo'}, {_id: 'bar'}]}});
        pubapi.query('tenants').then((_data) => {
            data = _data;
        });
=======
    it('can build a resource url', inject((pubapi) => {
        let url = pubapi.resourceURL('menus');
        expect(url).toBe('http://default.example.com/api/v1/menus/');
    }));

    it('can query', inject((pubapi, $httpBackend) => {
        var data;
        $httpBackend.expectGET(RESOURCE_URL)
            .respond(200, {_embedded: {_items: [{_id: 'foo'}, {_id: 'bar'}]}});
        pubapi.query('tenants').then(_data => data = _data);
>>>>>>> Added web publisher module
        $httpBackend.flush();
        expect(data.length).toBe(2);
    }));

    it('can handle errors', inject((pubapi, $httpBackend) => {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
        let success = jasmine.createSpy('ok');
        let error = jasmine.createSpy('error');

        $httpBackend.expectGET(RESOURCE_URL)
            .respond(500);
=======
        $httpBackend.expectGET(RESOURCE_URL)
            .respond(500);
        let success = jasmine.createSpy('ok');
        let error = jasmine.createSpy('error');
>>>>>>> Added web publisher module
        pubapi.query('tenants').then(success, error);
        $httpBackend.flush();
        expect(success).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalled();
    }));

    it('can create new resource', inject((pubapi, $httpBackend) => {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
        let item = {name: 'foo'};

=======
        var item = {name: 'foo'};
>>>>>>> Added web publisher module
        $httpBackend.expectPOST(RESOURCE_URL)
            .respond(201, {id: '123'});
        pubapi.save('tenants', item);
        $httpBackend.flush();
        expect(item.id).toBe('123');
    }));

    it('can update an item', inject((pubapi, $httpBackend) => {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
        let item = {id: 'foo'};

=======
        var item = {id: 'foo'};
>>>>>>> Added web publisher module
        $httpBackend.expectPATCH(ITEM_URL, item)
            .respond(200, {updated: 'now'});
        pubapi.save('tenants', item, '123');
        $httpBackend.flush();
        expect(item.updated).toBe('now');
    }));
});
