
describe('superdesk.config', () => {
    angular.module('test.config', ['superdesk.config'])
        .config((defaultConfigProvider) => {
            defaultConfigProvider.set('foo', 'bar');
            defaultConfigProvider.set('foo', 'baz');
            defaultConfigProvider.set('a.b.c', true);
            defaultConfigProvider.set('server.protocol', 'foo');
            defaultConfigProvider.set('server.url', 'bar');
            defaultConfigProvider.set('editor', false);
        });

    beforeEach(window.module('test.config'));

    it('can set default config', inject((config) => {
        expect(config.foo).toBe('bar');
        expect(config.a.b.c).toBe(true);
        expect(config.server.protocol).toBe('foo');
        expect(config.server.url).toBe(''); // defined in mocks
    }));

    describe('deployConfig service', () => {
        it('can provide config', inject((deployConfig, $rootScope) => {
            let getSpy = jasmine.createSpy('get');
            let allSpy = jasmine.createSpy('all');

            deployConfig.config = {foo: 1, bar: 2, baz: 'x'};

            deployConfig.get('foo').then(getSpy);
            deployConfig.all({x: 'foo', y: 'baz'}).then(allSpy);

            $rootScope.$digest();

            expect(getSpy).toHaveBeenCalledWith(1);
            expect(allSpy).toHaveBeenCalledWith({x: 1, y: 'x'});
        }));
    });
});
