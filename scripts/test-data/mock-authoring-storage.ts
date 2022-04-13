import {authoringStorage, IAuthoringAutoSave, IAuthoringStorage} from 'apps/authoring-react/data-layer';
import {OrderedMap} from 'immutable';
import {noop} from 'lodash';
import {IVocabulary} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {testContentProfileV2} from 'test-data/test-content-profile-v2';
import {testVocabulary} from './test-vocabulary';

const testAutosave: IAuthoringAutoSave = {
    get: () => Promise.resolve(testArticle),
    delete: () => Promise.resolve(),
    cancel: noop,
    schedule: noop,
};

const testAuthoringStorage: IAuthoringStorage = {
    lock: () => Promise.resolve(testArticle),
    unlock: () => Promise.resolve(testArticle),
    getArticle: () => Promise.resolve({saved: testArticle, autosaved: testArticle}),
    saveArticle: () => Promise.resolve(testArticle),
    closeAuthoring: () => Promise.resolve(),
    getContentProfile: () => Promise.resolve(testContentProfileV2),
    getUserPreferences: () => Promise.resolve({}),
    autosave: testAutosave,
    getVocabularies: () => {
        let testVocabularies = OrderedMap<string, IVocabulary>();

        const ids = [
            'categories',
            'genre',
            'locators',
            'priority',
            'urgency',
        ];

        for (const id of ids) {
            testVocabularies = testVocabularies.set(id, {...testVocabulary, _id: id});
        }

        return testVocabularies;
    },
    hasFeature: () => false,
};

export function mockAuthoringStorage() {
    Object.assign(authoringStorage, testAuthoringStorage);
}
