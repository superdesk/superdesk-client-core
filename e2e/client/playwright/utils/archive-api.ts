import {assertOk, withApiContext} from './api';

// the item must not be locked; open it only after this resolves
export function patchArchiveItem(itemId: string, updates: Record<string, unknown>): Promise<void> {
    return withApiContext(async (api) => {
        const current = await api.get(`archive/${encodeURIComponent(itemId)}`);

        await assertOk(current, `fetching "${itemId}"`);

        const response = await api.patch(`archive/${encodeURIComponent(itemId)}`, {
            headers: {'If-Match': (await current.json())._etag},
            data: updates,
        });

        await assertOk(response, `updating "${itemId}"`);
    });
}

// locks the item in the session of the `storageState` user, as opening it for editing would
export function lockArchiveItem(itemId: string): Promise<void> {
    return withApiContext(async (api) => {
        const response = await api.post(`archive/${encodeURIComponent(itemId)}/lock`, {data: {lock_action: 'edit'}});

        await assertOk(response, `locking "${itemId}"`);
    });
}
