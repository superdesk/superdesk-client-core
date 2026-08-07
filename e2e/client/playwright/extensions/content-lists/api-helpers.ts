import {request, APIRequestContext, Page, Locator} from '@playwright/test';
import storageState from '../../.auth/user.json';

// Ensure exactly one trailing slash. Playwright's APIRequestContext resolves
// request paths against baseURL using WHATWG URL semantics, where a
// leading-slash path (e.g. '/content_lists') replaces the base path entirely
// and drops '/api'. Keeping the trailing slash here + relative request paths
// below makes resolution preserve the '/api' segment.
const SUPERDESK_API_URL = (process.env.SUPERDESK_URL || 'http://localhost:5002/api').replace(/\/?$/, '/');

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
};

function getToken(): string {
    const entry = storageState.origins[0].localStorage.find(({name}) => name === 'sess:token');

    if (entry == null) {
        throw new Error('sess:token not found in .auth/user.json');
    }

    return entry.value;
}

async function withApiContext<T>(callback: (api: APIRequestContext) => Promise<T>): Promise<T> {
    const api = await request.newContext({
        baseURL: SUPERDESK_API_URL,
        extraHTTPHeaders: {
            'Authorization': getToken(),
            'Content-Type': 'application/json',
        },
    });

    try {
        return await callback(api);
    } finally {
        await api.dispose();
    }
}

async function assertOk(response: {ok(): boolean; status(): number; text(): Promise<string>}, action: string) {
    if (!response.ok()) {
        throw new Error(`${action} failed: ${response.status()} ${await response.text()}`);
    }
}

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

/**
 * Drag & drop helper for react-beautiful-dnd. Playwright's dragTo doesn't
 * work with it reliably; rbd needs a sequence of distinct mouse events with
 * multiple move steps to pick the drag up.
 */
export async function dragAndDrop(page: Page, source: Locator, target: Locator): Promise<void> {
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (sourceBox == null || targetBox == null) {
        throw new Error('dragAndDrop: element is not visible');
    }

    const from = {x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2};
    const to = {x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2};

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();

    // small initial movement so react-beautiful-dnd starts the drag
    await page.mouse.move(from.x + 5, from.y + 5, {steps: 3});

    const steps = 15;

    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(
            from.x + ((to.x - from.x) * i) / steps,
            from.y + ((to.y - from.y) * i) / steps,
        );

        // eslint-disable-next-line no-await-in-loop
        await page.waitForTimeout(20);
    }

    await page.mouse.up();
}
