describe('WordCount directive', () => {
    var scope, elem, iscope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.extension-points'));
    beforeEach(inject(($rootScope, $compile) => {
        const html = '<span sd-word-count data-item="item.body_html" data-html="true"></span>';

        scope = $rootScope.$new();

        elem = $compile(html)(scope);
        scope.$digest();
        iscope = elem.isolateScope();
    }));

    it('count words', () => {
        /* check that the directive is counting words correctly */
        // if you modifiy following text, please change it in superdesk-core/tests/text_utils_test.py too
        const text = `
        <p>This is a test text with numbers (1 000 000 and 1,000,000 and 1.000.000)
        and <strong>compound word (two-done)</strong> and <em>abbreviation (Washington D.C.)</p>
        <p>it should be the same word count as in client and backend</p>`;

        scope.item = {body_html: text};
        scope.$apply();
        expect(iscope.numWords).toBe(32);
    });
});
