import {OrderedMap} from 'immutable';
import {IDesk} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';

/**
 * The /marked_for_desks endpoint toggles a single desk per call: posting
 * with an already-marked desk unmarks it. Callers must diff their selection
 * and issue one request per change.
 */
export function toggleMarkedDesk(deskId: string, articleId: string) {
    return httpRequestJsonLocal({
        method: 'POST',
        path: '/marked_for_desks',
        payload: {
            marked_desk: deskId,
            marked_item: articleId,
        },
    });
}

/**
 * Turns marked desk ids into desk objects, dropping ids that no longer exist. A desk can be
 * deleted while an article keeps the stale id, which would otherwise render as undefined.
 */
export function resolveDesks(deskIds: Array<string>, allDesks: OrderedMap<IDesk['_id'], IDesk>): Array<IDesk> {
    return deskIds
        .map((id) => allDesks.get(id))
        .filter((desk): desk is IDesk => desk != null);
}
