import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isPersonal} = superdesk.entities.article;

    return function getActions(articleNext: IArticle) {
        if (isPersonal(articleNext)) {
            return Promise.resolve([]);
        }

        const markForUser: IArticleAction = {
            label: gettext('Mark for user'),
            labelForGroup: gettext('Relations'),
            icon: 'icon-assign',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, articleNext);
            },
        };

        const unmark: IArticleAction = {
            label: gettext('Unmark user'),
            labelForGroup: gettext('Relations'),
            icon: 'icon-assign',
            onTrigger: () => {
                superdesk.entities.article.update({
                    ...articleNext,
                    marked_for_user: null,
                });
            },
        };

        const markForOtherUser: IArticleAction = {
            label: gettext('Mark for other user'),
            labelForGroup: gettext('Relations'),
            icon: 'icon-assign',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, articleNext);
            },
        };

        const assigned = articleNext.marked_for_user != null;

        if (assigned) {
            return Promise.resolve([unmark, markForOtherUser]);
        } else {
            return Promise.resolve([markForUser]);
        }
    }
}
