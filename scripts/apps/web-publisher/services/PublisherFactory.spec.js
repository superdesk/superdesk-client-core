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
        expect(pubapi.query).toHaveBeenCalledWith('tenants', undefined);
    }));
});
