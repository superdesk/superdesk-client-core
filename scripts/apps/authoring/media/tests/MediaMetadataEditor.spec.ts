import * as helper from 'apps/workspace/helpers/getLabelForFieldId';
import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

describe('media metadata editor', () => {
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {
                url: '',
                ws: undefined,
            },
        };

        Object.assign(appConfig, testConfig);
    });
    beforeEach(window.module(($provide) => {
        $provide.service('metadata', ($q) => ({
            initialize: () => $q.when({}),
            cvs: [],
        }));
    }));

    beforeEach(window.module('superdesk.config'));
    beforeEach(window.module('superdesk.apps.authoring.media'));

    beforeEach(inject(($q, metadata) => {
        spyOn(helper, 'getLabelNameResolver').and.returnValue($q.when(() => { /* no-op */ }));
        spyOn(metadata, 'initialize').and.returnValue($q.when({}));
    }));

    it('displays all fields', inject(($rootScope, $controller) => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
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
            schema: {
                picture: {
                    slugline: {type: 'string'},
                    headline: {type: 'string'},
                    genre: {type: 'list'},
                    category: {type: 'list'},
                },
            },
            validator_media_metadata: {},
        };

        Object.assign(appConfig, testConfig);

        const ctrl = $controller('MediaFieldsController');

        $rootScope.$digest();

        expect(ctrl.fields).not.toBeUndefined();
        expect(ctrl.fields.length).toBe(4);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['slugline', 'headline', 'category', 'genre']);
    }));

    it('displays fields with dislayOnMediaEditor set', inject(($rootScope, $controller) => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
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

        Object.assign(appConfig, testConfig);

        const ctrl = $controller('MediaFieldsController');

        $rootScope.$digest();

        expect(ctrl.fields.length).toBe(2);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['slugline', 'headline']);
    }));
});
