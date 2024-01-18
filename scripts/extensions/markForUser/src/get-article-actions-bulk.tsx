import {ISuperdesk, IArticle} from 'superdesk-api';
import {uniq} from 'lodash';
import {showModal} from '@superdesk/common';
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
                .map((item) => item.marked_for_user)
                .filter((marked_for_user) => marked_for_user != null),
        );

        const message = selectedUserIds.length > 1
            ? gettext('Items are marked for different users')
            : undefined;

        return Promise.resolve([{
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            onTrigger: () => {
                showModal(getMarkForUserModal({
                    superdesk: superdesk,
                    markForUser: (selectedUserId) => {
                        articles.forEach((article) => {
                            updateMarkedUser(superdesk, article, {marked_for_user: selectedUserId});
                        });
                    },
                    markForUserAndSend: (selectedUserId) => {
                        articles.forEach((article) => {
                            markForUserAndSendToNextStage(superdesk, article, selectedUserId);
                        });
                    },
                    locked: someItemsLocked,
                    lockedInOtherSession: someItemsLockedInOtherSession,
                    markedForUserInitial: selectedUserIds[0] ?? undefined,
                    message: message,
                }));
            },
        }]);
    };
}
