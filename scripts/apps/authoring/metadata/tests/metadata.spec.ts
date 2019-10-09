describe('superdesk.apps.authoring.metadata', () => {
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.extension-points'));

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

    describe('metadata service', () => {
        beforeEach(window.module('superdesk.apps.vocabularies'));

        it('can fetch new cv when created', inject(($rootScope, metadata, $q, api) => {
            metadata.cvs = [];
            const cv = {_id: 'foo'};

            spyOn(api, 'find').and.returnValue($q.when(cv));
            $rootScope.$broadcast('vocabularies:created', {vocabulary_id: cv._id});
            $rootScope.$digest();

            expect(api.find).toHaveBeenCalledWith('vocabularies', cv._id);
            expect(metadata.cvs).toEqual([cv]);
        }));

        it('can fetch updated cv', inject(($rootScope, metadata, $q, api) => {
            metadata.cvs = [{_id: 'foo', display_name: 'Foo'}, {_id: 'bar'}];
            spyOn(api, 'find').and.returnValue($q.when({_id: 'bar', display_name: 'Bar'}));
            $rootScope.$broadcast('vocabularies:updated', {vocabulary_id: 'bar'});
            $rootScope.$digest();

            expect(api.find).toHaveBeenCalledWith('vocabularies', 'bar');
            expect(metadata.cvs[1]).toEqual({_id: 'bar', display_name: 'Bar'});
        }));

        it('can get list of vocabularies for authoring header', inject((metadata, $q, $rootScope) => {
            spyOn(metadata, 'fetchMetadataValues').and.returnValue($q.when());
            metadata.cvs = [
                {_id: 'a', items: [{name: 'a', service: {a: 1}}], service: {all: 1}},
                {_id: 'b', items: [{name: 'b'}], service: {all: 1}},
                {_id: 'c', items: [{name: 'c'}], service: {b: 1}},
                {_id: 'd', items: []},
            ];

            metadata.getCustomVocabulariesForArticleHeader([], {a: 1, b: 1, c: 1, d: 1}, {})
                .then((cvs) => {
                    expect(['b']).toEqual(cvs.map((cv) => cv._id));
                });

            $rootScope.$digest();
        }));

        it('can get list of all vocabularies for authoring header', inject((metadata, $q, $rootScope) => {
            spyOn(metadata, 'fetchMetadataValues').and.returnValue($q.when());
            metadata.cvs = [
                {_id: 'a', items: [{name: 'a', service: {a: 1}}], service: {all: 1}},
                {_id: 'b', items: [{name: 'b'}], service: {all: 1}},
                {_id: 'c', items: [{name: 'c'}], service: {b: 1}},
                {_id: 'd', items: []},
            ];

            metadata.getAllCustomVocabulariesForArticleHeader({a: 1, b: 1, c: 1, d: 1}, {})
                .then(({customVocabulariesForArticleHeader: cvs}) => {
                    expect(['a', 'b', 'c']).toEqual(cvs.map((cv) => cv._id));
                });

            $rootScope.$digest();
        }));
    });
});
