import {ISuperdesk, IArticle} from 'superdesk-api';
import {uniq} from 'lodash';
import {getMarkForUserModal} from './get-mark-for-user-modal';

export function getActionsBulkInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {isPersonal, isLocked} = superdesk.entities.article;

    return function getActionsBulk(articles: Array<IArticle>) {
        // it doesn't make sense to display the action since it wouldn't get updated in the list anyway
        // when article is locked for editing all changes are temporary
        // and aren't displayed in the list item until the article is saved
        const someItemsLocked = articles.some(isLocked);

        if (articles.some(isPersonal) || someItemsLocked) {
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
