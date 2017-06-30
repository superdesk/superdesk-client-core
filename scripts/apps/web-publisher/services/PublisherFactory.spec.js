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
        expect(pubapi.query).toHaveBeenCalledWith('content/routes', {limit: 1000});
    }));

    it('can create menu', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', label: 'bar'};

        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageMenu(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('menus', data, undefined);
    }));

    it('can remove menu 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeMenu(123);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('menus', 123);
    }));

    it('can list menus', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.queryMenus();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('menus');
    }));

    it('can get menu 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'get').and.returnValue($q.when({}));
        publisher.getMenu(123);
        $rootScope.$digest();
        expect(pubapi.get).toHaveBeenCalledWith('menus', 123);
    }));

    it('can create list', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', type: 'manual'};

        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageList(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('content/lists', data, undefined);
    }));

    it('can remove list 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeList(123);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('content/lists', 123);
    }));

    it('can list lists', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.queryLists();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('content/lists');
    }));
});
