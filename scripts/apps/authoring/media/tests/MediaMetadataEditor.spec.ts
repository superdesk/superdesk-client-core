import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

describe('media metadata editor', () => {
    beforeEach(window.module('superdesk.config'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.authoring.media'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.workspace.content'));

    beforeEach(inject(($q, metadata, vocabularies) => {
        spyOn(metadata, 'initialize').and.returnValue($q.when({}));
        spyOn(vocabularies, 'getAllActiveVocabularies').and.returnValue($q.when([]));
    }));

    it('displays all fields', inject(($controller, $rootScope, $q, content) => {
        spyOn(content, 'getType').and.returnValue($q.when(null));

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

        $rootScope.$apply();

        expect(ctrl.fields).not.toBeUndefined();
        expect(ctrl.fields.length).toBe(4);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['slugline', 'headline', 'category', 'genre']);
    }));

    it('uses appConfig when picture profile exists', inject(($controller, $rootScope, $q, content) => {
        const pictureProfile = {
            editor: {
                byline: {
                    order: 1,
                    required: true,
                    displayOnMediaEditor: true,
                },
                alt_text: {
                    order: 2,
                    required: false,
                    displayOnMediaEditor: true,
                },
            },
            schema: {
                byline: {type: 'string'},
                alt_text: {type: 'string'},
            },
        };

        spyOn(content, 'getType').and.returnValue($q.when(pictureProfile));

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
                },
            },
            schema: {
                picture: {
                    slugline: {type: 'string'},
                    headline: {type: 'string'},
                },
            },
            validator_media_metadata: {},
        };

        Object.assign(appConfig, testConfig);

        const ctrl = $controller('MediaFieldsController');

        $rootScope.$apply();

        expect(content.getType).toHaveBeenCalledWith('picture');
        expect(ctrl.fields.length).toBe(2);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['slugline', 'headline']);
    }));

    it('falls back to picture profile when appConfig is missing', inject(($controller, $rootScope, $q, content) => {
        const pictureProfile = {
            editor: {
                byline: {
                    order: 1,
                    required: true,
                    displayOnMediaEditor: true,
                },
                alt_text: {
                    order: 2,
                    required: false,
                    displayOnMediaEditor: true,
                },
            },
            schema: {
                byline: {type: 'string'},
                alt_text: {type: 'string'},
            },
        };

        spyOn(content, 'getType').and.returnValue($q.when(pictureProfile));

        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            editor: {},
            schema: {},
            validator_media_metadata: {},
        };

        Object.assign(appConfig, testConfig);

        const ctrl = $controller('MediaFieldsController');

        $rootScope.$apply();

        expect(content.getType).toHaveBeenCalledWith('picture');
        expect(ctrl.fields.length).toBe(2);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['byline', 'alt_text']);
    }));

    it('displays fields with dislayOnMediaEditor set', inject(($rootScope, $controller, $q, content) => {
        spyOn(content, 'getType').and.returnValue($q.when(null));

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

        $rootScope.$apply();

        expect(ctrl.fields.length).toBe(2);
        expect(ctrl.fields.map((f) => f.field)).toEqual(['slugline', 'headline']);
    }));
});
