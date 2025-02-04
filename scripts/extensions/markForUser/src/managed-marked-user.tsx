import {ISuperdesk, IArticle} from 'superdesk-api';
import {showModal} from '@superdesk/common';
import {getMarkForUserModal} from './get-mark-for-user-modal';
import {updateMarkedUser, markForUserAndSendToNextStage} from './common';

export function manageMarkedUserForSingleArticle(superdesk: ISuperdesk, article: IArticle) {
    const {isLocked, isLockedInOtherSession} = superdesk.entities.article;

    showModal(getMarkForUserModal({
        superdesk: superdesk,
        markForUser: (selectedUserId) => {
            updateMarkedUser(superdesk, article, {marked_for_user: selectedUserId});
        },
        markForUserAndSend: (selectedUserId) => {
            markForUserAndSendToNextStage(superdesk, article, selectedUserId);
        },
        locked: isLocked(article),
        lockedInOtherSession: isLockedInOtherSession(article),
        markedForUserInitial: article.marked_for_user === null ? undefined : article.marked_for_user,
    }));
}
