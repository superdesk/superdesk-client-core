describe('publisher service', () => {
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
=======

>>>>>>> Added web publisher module
    beforeEach(window.module('superdesk.apps.web_publisher'));

    it('can create site', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', subdomain: 'bar'};
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e

=======
>>>>>>> Added web publisher module
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageSite(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('tenants', data, undefined);
    }));

<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
    it('can remove site 123', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'remove').and.returnValue($q.when({}));
        publisher.removeSite(123);
        $rootScope.$digest();
        expect(pubapi.remove).toHaveBeenCalledWith('tenants', 123);
    }));

=======
>>>>>>> Added web publisher module
    it('can list sites', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.querySites();
        $rootScope.$digest();
<<<<<<< 73c4543c334408bd75671df0f12ed5599fea3d4e
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
=======
        expect(pubapi.query).toHaveBeenCalledWith('tenants', undefined);
>>>>>>> Added web publisher module
    }));
});
