import {BrowserContextOptions} from '@playwright/test';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import storageState from '../.auth/user.json';
import {PUBLISHING_SECTIONS_ENABLED} from '../../test-extensions/publishing-sections/extension';

type StorageState = BrowserContextOptions['storageState'];

/**
 * Allows to set custom application configs while preserving values defined in .auth/user.json
 */
export function getStorageState(
    appConfigPatch: Partial<ISuperdeskGlobalConfig>,
    otherOptions?: {authoringReact?: boolean, publishingSections?: boolean},
): StorageState {
    const storageStateCopy = JSON.parse(JSON.stringify(storageState));

    storageStateCopy['origins'][0].localStorage.push({name: 'TEST_APP_CONFIG', value: JSON.stringify(appConfigPatch)});

    if (otherOptions?.authoringReact === true) {
        storageStateCopy['origins'][0].localStorage.push({name: 'auth-react', value: 'true'});
    }

    if (otherOptions?.publishingSections === true) {
        storageStateCopy['origins'][0].localStorage.push({name: PUBLISHING_SECTIONS_ENABLED, value: 'true'});
    }

    return storageStateCopy;
}
