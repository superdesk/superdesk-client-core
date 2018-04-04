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
            spyOn(vocabularies, 'getVocabularies').and.returnValue($q.when(vocabulariesData));

            var scope = $rootScope.$new();

            scope.item = {profile: 'motoring'};

            $compile('<div sd-authoring-header></div>')(scope);
            scope.$digest();
            expect(scope.item.anpa_category.length).toBe(1);
            expect(scope.item.anpa_category[0].name).toBe('Motoring');
            expect(scope.item.anpa_category[0].qcode).toBe('paservice:motoring');
            expect(scope.item.anpa_category[0].scheme).toBeUndefined();
        }));

    it('generates annotations field from the editor state', inject((authoring) => {
        let item = {
            operation: 'update',
            state: 'in_progress',
            type: 'text',
            unique_name: '#12',
            guid: 'urn:newsml:localhost:5000:2018-03-30T03:43:18.405058:c311c880-ca45-4d58-9148-cce1ddd034be',
            unique_id: 12,
            word_count: 3,
            slugline: 'item5',
            body_html: '<p>lorem ipsum dolor</p>',
            editor_state: [{
                entityMap: {},
                blocks: [{
                    depth: 0,
                    key: '2sso6',
                    entityRanges: [],
                    data: {},
                    type: 'unstyled',
                    text: 'lorem ipsum dolor'
                }]
            }]
        };
        let updates = {
            editor_state: [{
                entityMap: {},
                blocks: [{
                    depth: 0,
                    key: '2sso6',
                    entityRanges: [],
                    data: {
                        MULTIPLE_HIGHLIGHTS: {
                            lastHighlightIds: {ANNOTATION: 2},
                            highlightsData: {
                                'ANNOTATION-1': {
                                    type: 'ANNOTATION',
                                    data: {
                                        date: '2018-03-30T14:57:53.172Z',
                                        msg: '{"blocks":[{"key":"ejm11","text":"Annotation 1","type":"unstyled",' +
                                            '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],' +
                                            '"entityMap":{}}',
                                        author: 'admin',
                                        annotationType: 'regular'
                                    }
                                },
                                'ANNOTATION-2': {
                                    type: 'ANNOTATION',
                                    data: {
                                        date: '2018-03-30T14:58:20.876Z',
                                        msg: '{"blocks":[{"key":"9i73f","text":"Annotation 2","type":"unstyled",' +
                                            '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},' +
                                            '{"key":"d3vb3","text":"Line 2","type":"unstyled","depth":0,' +
                                            '"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
                                        author: 'admin',
                                        annotationType: 'regular'
                                    }
                                }
                            }
                        }
                    },
                    inlineStyleRanges: [{
                        offset: 6,
                        length: 5,
                        style: 'ANNOTATION-1'
                    },
                    {
                        offset: 12,
                        length: 5,
                        style: 'ANNOTATION-2'
                    }],
                    type: 'unstyled',
                    text: 'lorem ipsum dolor'
                }]
            }]
        };

        authoring.save(item, updates);
        expect(updates.annotations).toEqual([{
            body: '<p>Annotation 1</p>',
            type: 'regular',
            id: '1'
        },
        {
            body: '<p>Annotation 2</p><p>Line 2</p>',
            type: 'regular',
            id: '2'
        }]);
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
