
describe('superdesk.core.features module', () => {
    beforeEach(window.module('superdesk.core.features'));
    beforeEach(inject((urls, $q) => {
        spyOn(urls, 'links').and.returnValue($q.when({users: 'http://users'}));
    }));

    it('can detect features based on resources', inject((urls, features, $rootScope) => {
        $rootScope.$digest();
        expect(!!features.users).toBe(true);
        expect(urls.links).toHaveBeenCalled();
    }));
});
