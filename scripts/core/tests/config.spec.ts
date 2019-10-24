
describe('superdesk.config', () => {
    angular.module('test.config', ['superdesk.config']);

    beforeEach(window.module('test.config'));
    describe('deployConfig service', () => {
        it('can provide config', inject((deployConfig, $rootScope) => {
            const getSpy = jasmine.createSpy('get');
            const allSpy = jasmine.createSpy('all');

            deployConfig.config = {foo: 1, bar: 2, baz: 'x'};

            deployConfig.get('foo').then(getSpy);
            deployConfig.all({x: 'foo', y: 'baz'}).then(allSpy);

            $rootScope.$digest();

            expect(getSpy).toHaveBeenCalledWith(1);
            expect(allSpy).toHaveBeenCalledWith({x: 1, y: 'x'});
        }));
    });
});
