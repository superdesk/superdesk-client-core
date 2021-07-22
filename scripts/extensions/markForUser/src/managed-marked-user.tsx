import {ISuperdesk, IArticle} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';
import {updateMarkedUser, markForUserAndSendToNextStage} from './common';

export function manageMarkedUserForSingleArticle(superdesk: ISuperdesk, article: IArticle) {
    const {isLocked, isLockedInOtherSession} = superdesk.entities.article;

    superdesk.ui.showModal(getMarkForUserModal({
        superdesk: superdesk,
        markForUser: (selectedUserId, selectedUserSignOff) => {
            updateMarkedUser(superdesk, article,
                {marked_for_user: selectedUserId, marked_for_sign_off: selectedUserSignOff},
            );
        },
        markForUserAndSend: (selectedUserId, selectedUserSignOff) => {
            markForUserAndSendToNextStage(superdesk, article, selectedUserId, selectedUserSignOff);
        },
        locked: isLocked(article),
        lockedInOtherSession: isLockedInOtherSession(article),
        markedForUserInitial: article.marked_for_user === null ? undefined : article.marked_for_user,
        markedForUserSignOffInitial: article.marked_for_sign_off === null ?
            undefined :
            article.marked_for_sign_off,
    }));
}
