import {assertOk, withApiContext} from './api';

/**
 * Article ids baked into the "main" database snapshot
 * (e2e/server/dump/full/main/superdesk_e2e/archive.json.bz2).
 */
export const FIXTURE_ARTICLES = {
    inProgress: {
        id: 'urn:newsml:localhost:5000:2023-11-15T10:53:56.032654:3503f3f4-1d5f-48b2-8f3d-35120820d8ee',
        headline: 'test sports story',
    },
    published: {
        id: 'urn:newsml:localhost:5000:2025-04-29T08:18:00.176925:d15f9b5a-55e1-4abb-9312-9224c7654ed6',
        headline: 'Story 5',
    },
    inProgress2: {
        id: 'urn:newsml:localhost:5000:2024-02-05T11:50:25.326226:ba8a185d-e556-497c-ae4b-8743f91e2d3a',
        headline: 'story 2',
    },
    inProgress3: {
        id: 'urn:newsml:localhost:5000:2024-03-07T17:16:53.401212:428f7b8a-7194-4678-b4d6-1f6edf560ed6',
        headline: 'Story 3',
    },
};

export function createContentList(
    name: string,
    extra: {[key: string]: unknown} = {},
): Promise<{_id: string; _etag: string}> {
    return withApiContext(async (api) => {
        const response = await api.post('content_lists', {data: {name, type: 'manual', ...extra}});

        await assertOk(response, `creating content list "${name}"`);

        return response.json();
    });
}

/**
 * Adds articles to a list via the bulk items endpoint.
 * Only valid as the first modification of the list (sends `updatedAt: null`).
 */
export function addListItems(listId: string, contentIds: Array<string>): Promise<void> {
    return withApiContext(async (api) => {
        const response = await api.patch(`content_lists/${listId}/items`, {
            data: {
                updatedAt: null,
                items: contentIds.map((contentId, index) => ({action: 'add', contentId, position: index})),
            },
        });

        await assertOk(response, `adding items to content list ${listId}`);
    });
}

export function updateListItems(listId: string, items: Array<{[key: string]: unknown}>): Promise<void> {
    return withApiContext(async (api) => {
        const listResponse = await api.get(`content_lists/${listId}`);

        await assertOk(listResponse, `fetching content list ${listId}`);

        const list = await listResponse.json();

        const response = await api.patch(`content_lists/${listId}/items`, {
            data: {
                updatedAt: list.content_list_items_updated_at ?? null,
                items,
            },
        });

        await assertOk(response, `updating items of content list ${listId}`);
    });
}

export function createWebhook(payload: {[key: string]: unknown}): Promise<{_id: string; _etag: string}> {
    return withApiContext(async (api) => {
        const response = await api.post('content_list_webhooks', {data: payload});

        await assertOk(response, 'creating webhook');

        return response.json();
    });
}
