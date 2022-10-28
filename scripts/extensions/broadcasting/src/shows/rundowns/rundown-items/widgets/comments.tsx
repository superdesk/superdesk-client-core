
import {IComment, IRestApiResponse} from 'superdesk-api';
import {IRundownItem} from '../../../../interfaces';
import {superdesk} from '../../../../superdesk';

const {httpRequestJsonLocal} = superdesk;

function getComments(entityId: string) {
    return httpRequestJsonLocal<IRestApiResponse<IComment>>({
        method: 'GET',
        path: '/rundown_comments',
        urlParams: {
            where: {
                item: entityId,
            },
        },
    }).then(({_items}) => _items);
}

function addComment(entityId: string, text: string) {
    return httpRequestJsonLocal({
        method: 'POST',
        path: '/rundown_comments',
        payload: {
            item: entityId,
            text: text,
        },
    }).then(() => undefined);
}

export const commentsWidget = superdesk.authoringGeneric.sideWidgets.comments<IRundownItem>(
    getComments,
    addComment,

    // to add a comment, entity ID is required
    // widget can't be shown if item is in creation mode and hasn't been saved yet
    (entity) => entity._id !== '',
);
