import {repeat} from 'lodash';

describe('sd-reading-time', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.spellcheck'));
    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    it('can estimate reading time in japanese', inject(($compile, $rootScope) => {
        const scope = $rootScope.$new();
        const elem = $compile('<div sd-reading-time data-item="content" data-language="language" />')(scope);

        scope.content = repeat('x', 5000);
        scope.$digest();
        expect(elem.text()).toBe('less than one minute read');

        scope.language = 'ja';
        scope.$digest();
        expect(elem.text()).toBe('8 min read');

        scope.content = repeat(' ', 5000);
        scope.$digest();
        expect(elem.text()).toBe('less than one minute read');
    }));
});
