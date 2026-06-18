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
