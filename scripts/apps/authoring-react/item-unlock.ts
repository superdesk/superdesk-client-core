import {IArticle} from 'superdesk-api';

/**
 * Whether an `item:unlock` message releases `item` from a session other than the current one,
 * which is when angular's `AuthoringDirective` tells the user who unlocked the item.
 */
export function isUnlockedFromAnotherSession(
    item: {_id: IArticle['_id']},
    message: {item: IArticle['_id']; lock_session: string},
    currentSessionId: string,
): boolean {
    return item._id === message.item && message.lock_session !== currentSessionId;
}
