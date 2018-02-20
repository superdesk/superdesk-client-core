import {repeat} from 'lodash';

describe('sd-reading-time', () => {
    beforeEach(window.module('superdesk.apps.authoring'));

    it('can estimate reading time in japanese', inject(($compile, $rootScope) => {
        const scope = $rootScope.$new();
        const elem = $compile('<div sd-reading-time data-item="content" data-language="language" />')(scope);

        scope.content = repeat('x', 500);
        scope.$digest();
        expect(elem.text()).toBe('less than one minute read');

        scope.language = 'jp';
        scope.$digest();
        expect(elem.text()).toBe('2 min read');

        scope.content = repeat(' ', 500);
        scope.$digest();
        expect(elem.text()).toBe('less than one minute read');
    }));
});