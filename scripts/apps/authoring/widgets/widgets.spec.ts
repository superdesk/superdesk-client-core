
describe('authoring widgets', () => {
    beforeEach(window.module('superdesk.templates-cache'));

    angular.module('superdesk.apps.authoring.widgets.test', ['superdesk.apps.authoring.widgets'])
        .config((authoringWidgetsProvider) => {
            authoringWidgetsProvider.widget('test', {});
        });

    beforeEach(window.module('superdesk.apps.authoring.widgets.test'));

    it('can register authoring widgets', inject((authoringWidgets) => {
        expect(authoringWidgets.some((widget) => widget._id === 'test')).toBe(true);
    }));
});
