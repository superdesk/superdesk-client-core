describe('superdesk.apps.authoring.metadata', () => {
    beforeEach(window.module('superdesk.apps.authoring.metadata'));

    describe('sdMetaWordsList directive', () => {
        let scope, iscope;

        beforeEach(inject(($rootScope, $compile) => {
            scope = $rootScope.$new();
            const elem = $compile('<div sd-meta-words-list data-item=item data-field="keywords" />')(scope);

            scope.item = {};
            scope.$digest();

            iscope = elem.isolateScope();
        }));

        it('stores the keyword as is', () => {
            iscope.selectedTerm = 'Foo';
            iscope.select();

            expect(scope.item.keywords).toEqual(['Foo']);
        });

        it('checks for duplicates ignoring case', () => {
            iscope.selectedTerm = 'FOO';
            iscope.select();

            iscope.selectedTerm = 'foo';
            iscope.select();

            expect(scope.item.keywords).toEqual(['FOO']);
        });
    });
});
