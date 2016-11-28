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
        expect(pubapi.query).toHaveBeenCalledWith('content/routes');
    }));
});
