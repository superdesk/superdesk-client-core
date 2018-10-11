
describe('superdesk.core.services.asset module', () => {
    beforeEach(window.module('superdesk.core.services.asset'));
    beforeEach(window.module(($provide) => {
        $provide.constant('config', {paths: {superdesk: 'scripts/bower_components/superdesk/app/'}});
    }));

    var asset;

    beforeEach(inject(($injector) => {
        asset = $injector.get('asset');
    }));

    it('can get templateUrl with scripts prefix', () => {
        var templateUrl = asset.templateUrl('superdesk/users/views/user-list-item.html');

        expect(templateUrl)
            .toBe('scripts/bower_components/superdesk/app/scripts/superdesk/users/views/user-list-item.html');
    });

    it('can get templateUrl for relative path', () => {
        var templateUrl = asset.templateUrl('/scripts/superdesk/users/views/user-list-item.html');

        expect(templateUrl)
            .toBe('scripts/bower_components/superdesk/app/scripts/superdesk/users/views/user-list-item.html');
    });

    it('can get templateUrl for absolute path', () => {
        var templateUrl = asset.templateUrl('http://localhost/scripts/superdesk/users/user-list-item.html');

        expect(templateUrl)
            .toBe('http://localhost/scripts/superdesk/users/user-list-item.html');
    });

    it('can get imageUrl', () => {
        var imageUrl = asset.imageUrl('superdesk/users/activity/thumbnail.png');

        expect(imageUrl)
            .toBe('scripts/bower_components/superdesk/app/scripts/superdesk/users/activity/thumbnail.png');
    });

    it('can get imageUrl for relative path', () => {
        var imageUrl = asset.imageUrl('../scripts/superdesk/users/activity/thumbnail.png');

        expect(imageUrl)
            .toBe('scripts/bower_components/superdesk/scripts/superdesk/users/activity/thumbnail.png');
    });
});
