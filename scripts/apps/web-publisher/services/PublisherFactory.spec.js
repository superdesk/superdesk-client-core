describe('publisher service', () => {

    beforeEach(window.module('superdesk.apps.web_publisher'));

    it('can create site', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', subdomain: 'bar'};
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageSite(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('tenants', data, undefined);
    }));

    it('can remove site 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeSite(123);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('tenants', 123);
    }));

    it('can list sites', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.querySites();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('tenants');
    }));

    it('can create route', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', type: 'collenction'};
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageRoute(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('content/routes', data, undefined);
    }));

    it('can remove route 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeRoute(123);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('content/routes', 123);
    }));

    it('can list routes', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.queryRoutes();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('content/routes', undefined);
    }));

    it('can list menus', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.queryMenus();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('menus', {'limit': 100});
    }));

    it('can get menu 42', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'get').and.returnValue($q.when({}));
        publisher.getMenu(42);
        $rootScope.$digest();
        expect(pubapi.get).toHaveBeenCalledWith('menus', 42);
    }));

    it('can save a new menu', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.saveMenu({
            name: 'Name',
            label: 'Label'
        });
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('menus', {menu: {
            name: 'Name',
            label: 'Label'
        }}, undefined);
    }));

    it('can update an existing menu', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.saveMenu({
            id: 34,
            name: 'Name2',
            label: 'Label2'
        });
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('menus', {menu: {
            name: 'Name2',
            label: 'Label2'
        }}, 34);
    }));

    it('can remove menu 42', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeMenu(42);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('menus', 42);
    }));
});
