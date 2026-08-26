import * as fs from 'fs';
import {BrowserContextOptions} from '@playwright/test';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import storageState from '../.auth/user.json';

type StorageState = BrowserContextOptions['storageState'];

/**
 * The committed storage-state files key their localStorage to the origin the
 * default stack serves the client from. A slot (see e2e/scripts/e2e-up.sh
 * --slot) serves it from another port, where those entries -- the session
 * token among them -- would never be applied, leaving the browser logged out.
 * e2e-up rewrites the origin of the storageState it points the config at; the
 * per-spec ones below have to do the same.
 */
const COMMITTED_ORIGIN = 'http://localhost:9000';

function withSlotOrigin<T extends {origins?: Array<{origin: string}>}>(state: T): T {
    const clientUrl = (process.env.CLIENT_URL ?? '').replace(/\/$/, '');

    if (clientUrl.length < 1 || clientUrl === COMMITTED_ORIGIN) {
        return state;
    }

    for (const origin of state.origins ?? []) {
        origin.origin = origin.origin.replace(COMMITTED_ORIGIN, clientUrl);
    }

    return state;
}

/**
 * Allows to set custom application configs while preserving values defined in .auth/user.json
 */
export function getStorageState(
    appConfigPatch: Partial<ISuperdeskGlobalConfig>,
    otherOptions?: {authoringReact?: boolean},
): StorageState {
    const storageStateCopy = JSON.parse(JSON.stringify(storageState));

    storageStateCopy['origins'][0].localStorage.push({name: 'TEST_APP_CONFIG', value: JSON.stringify(appConfigPatch)});

    if (otherOptions?.authoringReact === true) {
        storageStateCopy['origins'][0].localStorage.push({name: 'auth-react', value: 'true'});
    }

    return withSlotOrigin(storageStateCopy);
}

/**
 * Reads a committed storage-state file, for specs that run as another user.
 * Use this instead of passing the path to `test.use({storageState})` so the
 * state also works against a slot.
 */
export function getStorageStateFromFile(filePath: string): StorageState {
    return withSlotOrigin(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
}
