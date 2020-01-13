import {ISuperdesk, IArticle, IArticleAction} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isPersonal, isLocked, isLockedByCurrentUser, isArchived, isPublished} = superdesk.entities.article;

    return function getActions(articleNext: IArticle) {
        const locked = isLocked(articleNext);
        const lockedByCurrentUser = isLockedByCurrentUser(articleNext);
        const lockedBySomeoneElse = locked && !lockedByCurrentUser;

        if (
            isPersonal(articleNext)
            || lockedBySomeoneElse // marking for user is sometimes allowed for users holding the lock
            || articleNext.state === 'spiked'
        ) {
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
                superdesk.entities.article.patch(
                    articleNext,
                    {
                        marked_for_user: null,
                    },
                );
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

        // Mark and send isn't allowed for locked items even if for users holding the lock
        // because items can't be sent if they are still being edited

        const markForUserAndSend: IArticleAction = {
            label: gettext('Mark and send'),
            icon: 'icon-assign',
            groupId: 'highlights',
            onTrigger: () => manageMarkedUserForSingleArticle(superdesk, articleNext, true),
        };

        const markForOtherUserAndSend: IArticleAction = {
            label: gettext('Mark for other and send'),
            groupId: 'highlights',
            icon: 'icon-assign',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, articleNext, true);
            },
        };

        const assigned = articleNext.marked_for_user != null;
        const hasDesk = articleNext.task != null && articleNext.task.desk != null;

        if (assigned) {
            const actions = [unmark, markForOtherUser];

            if (hasDesk && !locked) {
                actions.push(markForOtherUserAndSend);
            }

            return Promise.resolve(actions);
        } else {
            const actions = [markForUser];

            if (hasDesk && !locked && !isPublished(articleNext) && !isArchived(articleNext)) {
                actions.push(markForUserAndSend);
            }

            return Promise.resolve(actions);
        }
    };
}
