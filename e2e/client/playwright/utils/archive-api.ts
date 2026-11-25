import {APIRequestContext, expect} from '@playwright/test';
import {assertOk, withApiContext} from './api';

// `archive` reads go through elastic, whose analysed fields an exact `where` does not match,
// so the snapshot's few items are listed and filtered here.
async function listAll(api: APIRequestContext, resource: string): Promise<Array<any>> {
    const response = await api.get(resource, {params: {max_results: 200}});

    await assertOk(response, `listing ${resource}`);

    return (await response.json())._items;
}

async function findOne(api: APIRequestContext, resource: string, field: string, value: string): Promise<any> {
    let item: any;

    // right after a snapshot restore the listing can briefly come back without the item
    await expect(async () => {
        item = (await listAll(api, resource)).find((candidate) => candidate[field] === value);

        if (item == null) {
            throw new Error(`no ${resource} has ${field} "${value}"`);
        }
    }).toPass({timeout: 10000});

    return item;
}

export function markItemForUser(
    slugline: string,
    username: string,
): Promise<{firstcreated: string; versioncreated: string}> {
    return withApiContext(async (api) => {
        const item = await findOne(api, 'archive', 'slugline', slugline);
        const user = await findOne(api, 'users', 'username', username);

        const response = await api.patch(`archive/${item._id}`, {
            headers: {'If-Match': item._etag},
            data: {marked_for_user: user._id},
        });

        await assertOk(response, `marking "${slugline}" for ${username}`);

        const {firstcreated, versioncreated} = await response.json();

        return {firstcreated, versioncreated};
    });
}

// `indexedSlugline` is looked up first, so an index still filling after a restore cannot pass for "nothing marked".
export function getSluglinesMarkedFor(username: string, indexedSlugline: string): Promise<Array<string>> {
    return withApiContext(async (api) => {
        await findOne(api, 'archive', 'slugline', indexedSlugline);

        const user = await findOne(api, 'users', 'username', username);

        return (await listAll(api, 'archive'))
            .filter((item) => item.marked_for_user === user._id)
            .map((item) => item.slugline);
    });
}

// counted like the top bar badge: the unread ones among the user's newest 8 notifications
export function getUnreadNotificationCount(username: string): Promise<number> {
    return withApiContext(async (api) => {
        const user = await findOne(api, 'users', 'username', username);
        const response = await api.get('activity', {
            params: {max_results: 8, where: JSON.stringify({'recipients.user_id': user._id})},
        });

        await assertOk(response, `listing the notifications of ${username}`);

        return (await response.json())._items
            .filter((activity: any) => activity.recipients.some(
                (recipient: any) => recipient.user_id === user._id && recipient.read !== true,
            ))
            .length;
    });
}
