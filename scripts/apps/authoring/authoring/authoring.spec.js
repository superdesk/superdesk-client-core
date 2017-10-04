describe('authoring', () => {
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('set anpa category value for required subservice',
        inject(($httpBackend, $q, $rootScope, $compile, vocabularies, archiveService, content, $templateCache) => {
            $templateCache.put(
                'scripts/apps/authoring/views/authoring-header.html',
                '<div>{{scope.item}}</div>'
            );

            var vocabulariesData = [
                {
                    _id: 'categories',
                    display_name: 'Categories',
                    type: 'manageable',
                    items: [{is_active: true, name: 'Motoring', qcode: 'paservice:motoring'}]
                },
                {
                    _id: 'subservice_motoring',
                    display_name: 'Motoring sub-service',
                    type: 'manageable',
                    service: {'paservice:motoring': 1},
                    priority: 2,
                    items: [{is_active: true, name: 'News', qcode: 'paservice:motoring:news'}]
                }
            ];
            var schema = {
                subject: {
                    mandatory_in_list: {
                        scheme: {
                            subservice_motoring: 'subservice_motoring'
                        }
                    }
                }
            };

            spyOn(archiveService, 'isLegal').and.returnValue(false);
            spyOn(content, 'getType').and.returnValue($q.resolve('motoring'));
            spyOn(content, 'editor').and.returnValue({});
            spyOn(content, 'schema').and.returnValue(schema);
            spyOn(vocabularies, 'getVocabularies').and.returnValue($q.when({_items: vocabulariesData}));

            var scope = $rootScope.$new();

            scope.item = {profile: 'motoring'};

            $compile('<div sd-authoring-header></div>')(scope);
            scope.$digest();
            expect(scope.item.anpa_category.length).toBe(1);
            expect(scope.item.anpa_category[0].name).toBe('Motoring');
            expect(scope.item.anpa_category[0].qcode).toBe('paservice:motoring');
            expect(scope.item.anpa_category[0].scheme).toBeUndefined();
        }));

    describe('authoring workspace', () => {
        it('can open an item in new window', inject(($window, authoringWorkspace) => {
            spyOn($window, 'open');
            authoringWorkspace.popup({_id: 'foo'}, 'edit');
            expect($window.open)
                .toHaveBeenCalledWith(
                    'http://server/#/workspace/monitoring?item=foo&action=edit&popup',
                    'foo'
                );
        }));
    });
});
