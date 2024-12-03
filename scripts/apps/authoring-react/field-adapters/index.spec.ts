import {sdApi} from 'api';
import {OrderedMap} from 'immutable';
import {IVocabulary} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {testVocabulary} from 'test-data/test-vocabulary';
import {getBaseFieldsAdapter} from '.';

let getAllVocabulariesOriginal = sdApi.vocabularies.getAll;

const vocabulariesToRestore: Partial<typeof sdApi.vocabularies> = {
    getAll: getAllVocabulariesOriginal,
};

describe('field adapters', () => {
    beforeEach(() => {
        Object.assign(sdApi, {
            ...sdApi,
            vocabularies: {},
        });

        const vocabulariesStub: Partial<typeof sdApi.vocabularies> = {
            getAll: () => {
                let testVocabularies = OrderedMap<string, IVocabulary>();

                const ids = [
                    'categories',
                    'default_categories',
                    'languages',
                    'genre',
                    'urgency',
                    'priority',
                    'signal',
                    'rightsinfo',
                    'crop_sizes',
                    'desk_types',
                    'replace_words',
                    'locators',
                    'product_types',
                    'annotation_types',
                    'author_roles',
                    'job_titles',
                    'package-story-labels',
                    'usageterms',
                    'contact_mobile_usage',
                    'contact_phone_usage',
                    'countries',
                    'regions',
                    'type',
                    'subscriber_types',
                    'g2_content_type',
                    'eventoccurstatus',
                    'newscoveragestatus',
                    'event_calendars',
                    'assignment_priority',
                    'camera',
                    'custom-sorting',
                ];

                for (const id of ids) {
                    testVocabularies = testVocabularies.set(id, {...testVocabulary, _id: id});
                }

                return testVocabularies;
            },
            getCustomFieldVocabularies: () => [],
            getVocabularyItemLabel: (term) => term.name,
        };

        Object.assign(sdApi.vocabularies, vocabulariesStub);
    });

    afterEach(() => {
        Object.assign(sdApi.vocabularies, vocabulariesToRestore);
    });

    it('dropdown adapters can handle `null` as value', () => {
        const baseAdapter = getBaseFieldsAdapter();
        const dropdownAdapters =
            Object.values(baseAdapter)
                .filter((adapter) => {
                    const fieldAdapter = adapter.getFieldV2({}, {}, () => false);

                    /**
                     * Subject only works in multi-select mode,
                     * thus `null` would never be passed to it.
                     */
                    const skipField = fieldAdapter.id === 'subject';

                    return fieldAdapter.fieldType === 'dropdown' && skipField !== true;
                });

        for (const dropdownAdapter of dropdownAdapters) {
            if (dropdownAdapter.storeValue != null) {
                expect(() => {
                    dropdownAdapter.storeValue(null, testArticle, {}, false);
                }).not.toThrow();
            }
        }
    });
});
