
'use strict';

describe('authoring widgets', function() {
    beforeEach(window.module('superdesk.templates-cache'));

    angular.module('superdesk.apps.authoring.widgets.test', ['superdesk.apps.authoring.widgets'])
        .config(function(authoringWidgetsProvider) {
            authoringWidgetsProvider.widget('test', {});
        });

    beforeEach(window.module('superdesk.apps.authoring.widgets.test'));

    it('can register authoring widgets', inject(function(authoringWidgets) {
        expect(authoringWidgets.length).toBe(1);
    }));
});
