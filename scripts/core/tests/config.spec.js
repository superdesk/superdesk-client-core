
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
        expect(config.server.url).toBe(null); // defined in mocks
    }));
});
