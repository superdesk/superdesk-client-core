
describe('authoring widgets', () => {
    beforeEach(window.module('superdesk.templates-cache'));

    angular.module('superdesk.apps.authoring.widgets.test', ['superdesk.apps.authoring.widgets'])
        .config((authoringWidgetsProvider) => {
            authoringWidgetsProvider.widget('test', {});
        });

    beforeEach(window.module('superdesk.apps.authoring.widgets.test'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    it('can register authoring widgets', inject((authoringWidgets) => {
        expect(authoringWidgets.length).toBe(1);
    }));
});
