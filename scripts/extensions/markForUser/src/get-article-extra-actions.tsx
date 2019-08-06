import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getExtraActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return function getExtraActions(article: IArticle) {
        const markForUser: IArticleAction = {
            label: gettext('User'),
            onTrigger: () => manageMarkedUserForSingleArticle(superdesk, article, true),
            groupId: 'mark-item',
        };

        return Promise.resolve([markForUser]);
    };
}
