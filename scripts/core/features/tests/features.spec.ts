
describe('superdesk.core.features module', () => {
    beforeEach(window.module('superdesk.core.features'));

    it('can detect features based on resources', inject((urls, features, $rootScope) => {
        spyOn(urls, 'links').and.callThrough();
        $rootScope.$digest();
        expect(!!features.users).toBe(true);
    }));
});
