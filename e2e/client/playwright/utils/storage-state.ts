import {BrowserContextOptions} from '@playwright/test';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import storageState from '../.auth/user.json';

type StorageState = BrowserContextOptions['storageState'];

/**
 * Allows to set custom application configs while preserving values defined in .auth/user.json
 */
export function getStorageState(appConfigPatch: Partial<ISuperdeskGlobalConfig>): StorageState {
    const storageStateCopy = JSON.parse(JSON.stringify(storageState));

    storageStateCopy['origins'][0].localStorage.push({name: 'TEST_APP_CONFIG', value: JSON.stringify(appConfigPatch)});

    return storageStateCopy;
}
