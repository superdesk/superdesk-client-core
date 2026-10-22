import storageState from '../.auth/user.json';
import {assertOk, withApiContext} from './content-lists-api';

function getSessionId(): string {
    const entry = storageState.origins[0].localStorage.find(({name}) => name === 'sess:id');

    if (entry == null) {
        throw new Error('sess:id not found in .auth/user.json');
    }

    return entry.value;
}

export function getUserPreference(key: string): Promise<any> {
    return withApiContext(async (api) => {
        const response = await api.get(`preferences/${getSessionId()}`);

        await assertOk(response, 'fetching preferences');

        return (await response.json()).user_preferences?.[key];
    });
}

// the app reads preferences once on load, so call this before navigating
export function setUserPreference(key: string, value: unknown): Promise<void> {
    return withApiContext(async (api) => {
        const current = await api.get(`preferences/${getSessionId()}`);

        await assertOk(current, 'fetching preferences');

        const response = await api.patch(`preferences/${getSessionId()}`, {
            headers: {'If-Match': (await current.json())._etag},
            data: {user_preferences: {[key]: value}},
        });

        await assertOk(response, `storing the "${key}" preference`);
    });
}
