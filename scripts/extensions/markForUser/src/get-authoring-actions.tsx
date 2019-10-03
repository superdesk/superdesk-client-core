import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function authoringActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return function getAuthoringActions(article: IArticle) {
        const markForUser: IArticleAction = {
            label: gettext('User'),
            onTrigger: () => manageMarkedUserForSingleArticle(superdesk, article),
            groupId: 'highlights',
        };

        return Promise.resolve([markForUser]);
    };
}
