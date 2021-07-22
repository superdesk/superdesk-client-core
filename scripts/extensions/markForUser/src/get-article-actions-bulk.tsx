import {ISuperdesk, IArticle} from 'superdesk-api';
import {uniq} from 'lodash';
import {getMarkForUserModal} from './get-mark-for-user-modal';
import {updateMarkedUser, markForUserAndSendToNextStage, canChangeMarkedUser} from './common';

export function getActionsBulkInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isLocked, isLockedInOtherSession} = superdesk.entities.article;

    return function getActionsBulk(articles: Array<IArticle>) {
        const someItemsLocked = articles.some(isLocked);
        const someItemsLockedInOtherSession = articles.some(isLockedInOtherSession);

        if (articles.some((article) => !canChangeMarkedUser(superdesk, article))) {
            return Promise.resolve([]);
        }

        const selectedUserIds = uniq(
            articles
                .map((item) => item.marked_for_user && item.marked_for_sign_off)
                .filter((marked_for_user, marked_for_sign_off) =>
                    marked_for_user != null && marked_for_sign_off !== null),
        );

        const message = selectedUserIds.length > 1
            ? gettext('Items are marked for different users')
            : undefined;

        return Promise.resolve([{
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            onTrigger: () => {
                superdesk.ui.showModal(getMarkForUserModal({
                    superdesk: superdesk,
                    markForUser: (selectedUserId, selectedUserSignOff) => {
                        articles.forEach((article) => {
                            updateMarkedUser(superdesk, article,
                                {marked_for_user: selectedUserId, marked_for_sign_off: selectedUserSignOff});
                        });
                    },
                    markForUserAndSend: (selectedUserId, selectedUserSignOff) => {
                        articles.forEach((article) => {
                            markForUserAndSendToNextStage(superdesk, article, selectedUserId, selectedUserSignOff);
                        });
                    },
                    locked: someItemsLocked,
                    lockedInOtherSession: someItemsLockedInOtherSession,
                    markedForUserInitial: selectedUserIds[0] ?? undefined,
                    markedForUserSignOffInitial: selectedUserIds[0] ?? undefined,
                    message: message,
                }));
            },
        }]);
    };
}
