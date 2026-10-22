import {assertOk, getSessionValue, withApiContext} from './api';

export function getUserPreference(key: string): Promise<any> {
    return withApiContext(async (api) => {
        const response = await api.get(`preferences/${getSessionValue('sess:id')}`);

        await assertOk(response, 'fetching preferences');

        return (await response.json()).user_preferences?.[key];
    });
}

// the app reads preferences once on load, so call this before navigating
export function setUserPreference(key: string, value: unknown): Promise<void> {
    return withApiContext(async (api) => {
        const current = await api.get(`preferences/${getSessionValue('sess:id')}`);

        await assertOk(current, 'fetching preferences');

        const response = await api.patch(`preferences/${getSessionValue('sess:id')}`, {
            headers: {'If-Match': (await current.json())._etag},
            data: {user_preferences: {[key]: value}},
        });

        await assertOk(response, `storing the "${key}" preference`);
    });
}
