import fs from 'fs';
import path from 'path';
import {BrowserContextOptions} from '@playwright/test';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import committedStorageState from '../.auth/user.json';

type StorageState = BrowserContextOptions['storageState'];

/**
 * localStorage is keyed by origin, and the committed storage state is keyed to
 * http://localhost:9000. A slot serves the client from another port, so e2e-up.sh
 * writes an origin-rewritten copy and points `PLAYWRIGHT_STORAGE_STATE` at it
 * (playwright.config.ts resolves it relative to e2e/client). Patching the committed
 * copy instead would put both the session and the config patch under an origin the
 * browser never visits, leaving the test stuck on the login screen.
 */
function getBaseStorageState(): {origins: Array<{origin: string; localStorage: Array<unknown>}>} {
    const slotStorageState = process.env.PLAYWRIGHT_STORAGE_STATE;

    if (slotStorageState != null && slotStorageState !== '') {
        return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', slotStorageState), 'utf-8'));
    }

    return JSON.parse(JSON.stringify(committedStorageState));
}

/**
 * Allows to set custom application configs while preserving values defined in .auth/user.json
 */
export function getStorageState(
    appConfigPatch: Partial<ISuperdeskGlobalConfig>,
    otherOptions?: {authoringReact?: boolean},
): StorageState {
    const storageStateCopy = getBaseStorageState();

    storageStateCopy['origins'][0].localStorage.push({name: 'TEST_APP_CONFIG', value: JSON.stringify(appConfigPatch)});

    if (otherOptions?.authoringReact === true) {
        storageStateCopy['origins'][0].localStorage.push({name: 'auth-react', value: 'true'});
    }

    return storageStateCopy as StorageState;
}
