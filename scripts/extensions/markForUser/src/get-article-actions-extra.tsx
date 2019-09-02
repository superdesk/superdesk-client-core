import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getActionsExtraInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return function getActionsExtra(article: IArticle) {
        const markForUser: IArticleAction = {
            label: gettext('User'),
            onTrigger: () => manageMarkedUserForSingleArticle(superdesk, article),
            groupId: 'highlights',
        };

        return Promise.resolve([markForUser]);
    };
}
