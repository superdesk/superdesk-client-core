import {authoringStorage, IAuthoringAutoSave, IAuthoringStorage} from 'apps/authoring-react/data-layer';
import {noop} from 'lodash';
import {testArticle} from 'test-data/test-article';
import {testContentProfileV2} from 'test-data/test-content-profile-v2';

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
};

export function mockAuthoringStorage() {
    Object.assign(authoringStorage, testAuthoringStorage);
}
