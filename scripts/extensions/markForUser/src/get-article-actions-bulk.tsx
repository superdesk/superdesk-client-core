import {ISuperdesk, IArticle} from 'superdesk-api';
import {uniq} from 'lodash';
import {getMarkForUserModal} from './get-mark-for-user-modal';

export function getActionsBulkInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isPersonal, isLocked} = superdesk.entities.article;

    return function getActionsBulk(articles: Array<IArticle>) {
        if (articles.some(isPersonal) || articles.some(isLocked)) {
            return Promise.resolve([]);
        }

        const selectedUserIds = uniq(
            articles
                .map((item) => item.marked_for_user)
                .filter((marked_for_user) => marked_for_user != null),
        );

        const initialUserId = selectedUserIds[0];
        const selectedUserIdInitial = selectedUserIds.length > 1 || initialUserId === null
            ? undefined
            : initialUserId;

        const message = selectedUserIds.length > 1
            ? gettext('Items are marked for different users')
            : undefined;

        return Promise.resolve([{
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            onTrigger: () => {
                superdesk.ui.showModal(getMarkForUserModal(
                    superdesk,
                    (selectedUserId) => {
                        articles.forEach((article) => {
                            superdesk.entities.article.update({
                                ...article,
                                marked_for_user: selectedUserId,
                            });
                        });
                    },
                    false,
                    selectedUserIdInitial,
                    message,
                ));
            },
        }]);
    };
}
