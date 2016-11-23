describe('publisher service', () => {

    beforeEach(window.module('superdesk.apps.web_publisher'));

    it('can create site', inject((publisher, pubapi, $q, $rootScope) => {
        let data = {name: 'foo', subdomain: 'bar'};
        spyOn(pubapi, 'save').and.returnValue($q.when({}));
        publisher.manageSite(data);
        $rootScope.$digest();
        expect(pubapi.save).toHaveBeenCalledWith('tenants', data, undefined);
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

    it('can list routes', inject((publisher, pubapi, $q, $rootScope) => {
        spyOn(pubapi, 'query').and.returnValue($q.when([]));
        publisher.queryRoutes();
        $rootScope.$digest();
        expect(pubapi.query).toHaveBeenCalledWith('content/routes', undefined);
    }));
});
