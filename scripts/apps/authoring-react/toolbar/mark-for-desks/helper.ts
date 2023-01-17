import {httpRequestJsonLocal} from 'core/helpers/network';

export function markedForDesks(deskIds: Array<string>, articleId: string) {
    return httpRequestJsonLocal({
        method: 'POST',
        path: '/marked_for_desks',
        payload: {
            marked_desks: deskIds,
            marked_item: articleId,
        },
    });
}
