
describe('superdesk.core.features module', () => {
    beforeEach(window.module('superdesk.core.features'));

    it('can detect features based on resources', inject((features, $rootScope, $httpBackend) => {
        $rootScope.$digest();
        $httpBackend.flush();
        expect(!!features.users).toBe(true);
    }));
});
