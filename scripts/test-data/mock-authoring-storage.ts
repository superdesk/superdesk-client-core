import {noop} from 'lodash';
import {IArticle, IAuthoringAutoSave, IAuthoringStorage} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {testContentProfileV2} from 'test-data/test-content-profile-v2';

const testAutosave: IAuthoringAutoSave<IArticle> = {
    get: () => Promise.resolve(testArticle),
    delete: () => Promise.resolve(),
    cancel: noop,
    schedule: noop,
};

const testAuthoringStorage: IAuthoringStorage<IArticle> = {
    lock: () => Promise.resolve(testArticle),
    unlock: () => Promise.resolve(testArticle),
    getArticle: () => Promise.resolve({saved: testArticle, autosaved: testArticle}),
    saveArticle: () => Promise.resolve(testArticle),
    closeAuthoring: () => Promise.resolve(),
    getContentProfile: () => Promise.resolve(testContentProfileV2),
    getUserPreferences: () => Promise.resolve({}),
    autosave: testAutosave,
    isLockedInCurrentSession: () => true,
};

// TODO: pass as props instead of overwriting
// export function mockAuthoringStorage() {
//     Object.assign(authoringStorage, testAuthoringStorage);
// }
