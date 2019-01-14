import * as helper from 'apps/workspace/helpers/getLabelForFieldId';

describe('media metadata editor', () => {
    beforeEach(window.module(($provide) => {
        $provide.service('metadata', ($q) => ({
            initialize: () => $q.when({}),
            cvs: [],
        }));
    }));

    beforeEach(window.module('superdesk.config'));
    beforeEach(window.module('superdesk.apps.authoring.media'));

    beforeEach(inject(($q) => {
        spyOn(helper, 'getLabelNameResolver').and.returnValue($q.when(() => { /* no-op */ }));
    }));

    it('dislays all fields', inject(($rootScope, $compile, deployConfig) => {
        deployConfig.config = {
            schema: {
                picture: {
                    slugline: {type: 'string'},
                    headline: {type: 'string'},
                    genre: {type: 'list'},
                    category: {type: 'list'},
                },
            },
            editor: {
                picture: {
                    slugline: {
                        order: 1,
                        required: true,
                    },
                    headline: {
                        order: 2,
                        required: true,
                    },
                    category: {
                        order: 3,
                        required: true,
                    },
                    genre: {
                        order: 4,
                        required: true,
                    },
                },
            },
        };
        let scope = $rootScope.$new(true);

        scope.item = {_id: 'foo'};

        let elm = $compile('<div sd-media-metadata-editor data-item="item"></div>')(scope);

        scope.$digest();

        let iScope = elm.isolateScope();

        expect(iScope.fields.length).toBe(4);
        expect(iScope.fields.map((f) => f.field)).toEqual(['slugline', 'headline', 'category', 'genre']);
    }));

    it('dislays fields with dislayOnMediaEditor set', inject(($rootScope, $compile, deployConfig) => {
        deployConfig.config = {
            schema: {
                picture: {
                    slugline: {type: 'string'},
                    headline: {type: 'string'},
                    genre: {type: 'list'},
                    category: {type: 'list'},
                },
            },
            editor: {
                picture: {
                    slugline: {
                        order: 1,
                        required: true,
                        displayOnMediaEditor: true,
                    },
                    headline: {
                        order: 2,
                        required: true,
                        displayOnMediaEditor: true,
                    },
                    category: {
                        order: 3,
                        required: true,
                        displayOnMediaEditor: false,
                    },
                    genre: {
                        order: 4,
                        required: true,
                        displayOnMediaEditor: false,
                    },
                },
            },
        };
        let scope = $rootScope.$new(true);

        scope.item = {_id: 'foo'};

        let elm = $compile('<div sd-media-metadata-editor data-item="item"></div>')(scope);

        scope.$digest();

        let iScope = elm.isolateScope();

        expect(iScope.fields.length).toBe(2);
        expect(iScope.fields.map((f) => f.field)).toEqual(['slugline', 'headline']);
    }));
});
