import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';
import {updateMarkedUser, canChangeMarkedUser} from './common';

export function getActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return function getActions(article: IArticle): Promise<Array<IArticleAction>> {
        if (!canChangeMarkedUser(superdesk, article)) {
            return Promise.resolve([]);
        }

        const markForUser: IArticleAction = {
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            groupId: 'highlights',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, article);
            },
        };

        const unmark: IArticleAction = {
            label: gettext('Unmark user'),
            icon: 'icon-assign',
            groupId: 'highlights',
            onTrigger: () => {
                updateMarkedUser(superdesk, article, {marked_for_user: null});
            },
        };

        const markForOtherUser: IArticleAction = {
            label: gettext('Mark for other user'),
            groupId: 'highlights',
            icon: 'icon-assign',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, article);
            },
        };

        if (article.marked_for_user == null) {
            return Promise.resolve([markForUser]);
        } else {
            return Promise.resolve([unmark, markForOtherUser]);
        }
    };
}
