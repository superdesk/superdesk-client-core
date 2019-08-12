import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isPersonal, isLocked} = superdesk.entities.article;

    return function getActions(articleNext: IArticle) {
        // it doesn't make sense to display the action since it wouldn't get updated in the list anyway
        // when article is locked for editing all changes are temporary
        // and aren't displayed in the list item until the article is saved
        const locked = isLocked(articleNext);

        if (isPersonal(articleNext) || locked) {
            return Promise.resolve([]);
        }

        const markForUser: IArticleAction = {
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            groupId: 'highlights',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, articleNext);
            },
        };

        const unmark: IArticleAction = {
            label: gettext('Unmark user'),
            icon: 'icon-assign',
            groupId: 'highlights',
            onTrigger: () => {
                superdesk.entities.article.update({
                    ...articleNext,
                    marked_for_user: null,
                });
            },
        };

        const markForOtherUser: IArticleAction = {
            label: gettext('Mark for other user'),
            groupId: 'highlights',
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
    };
}
