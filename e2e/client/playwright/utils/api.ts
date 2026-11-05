import {request, APIRequestContext} from '@playwright/test';
import storageState from '../.auth/user.json';

// Ensure exactly one trailing slash. Playwright's APIRequestContext resolves
// request paths against baseURL using WHATWG URL semantics, where a
// leading-slash path (e.g. '/content_lists') replaces the base path entirely
// and drops '/api'. Keeping the trailing slash here + relative request paths
// in callers makes resolution preserve the '/api' segment.
const SUPERDESK_API_URL = (process.env.SUPERDESK_URL || 'http://localhost:5002/api').replace(/\/?$/, '/');

export function getSessionValue(name: 'sess:token' | 'sess:id'): string {
    const entry = storageState.origins[0].localStorage.find((item) => item.name === name);

    if (entry == null) {
        throw new Error(`${name} not found in .auth/user.json`);
    }

    return entry.value;
}

export async function withApiContext<T>(callback: (api: APIRequestContext) => Promise<T>): Promise<T> {
    const api = await request.newContext({
        baseURL: SUPERDESK_API_URL,
        extraHTTPHeaders: {
            'Authorization': getSessionValue('sess:token'),
            'Content-Type': 'application/json',
        },
    });

    try {
        return await callback(api);
    } finally {
        await api.dispose();
    }
}

export async function assertOk(response: {ok(): boolean; status(): number; text(): Promise<string>}, action: string) {
    if (!response.ok()) {
        throw new Error(`${action} failed: ${response.status()} ${await response.text()}`);
    }
}
