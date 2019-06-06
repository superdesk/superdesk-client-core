import {ISuperdesk, IExtension, IArticleAction, IArticle} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';
import { uniq } from 'lodash';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                entities: {
                    article: {
                        getActions: (articleNext) => {
                            const markForUser: IArticleAction = {
                                label: gettext('Mark for user'),
                                labelForGroup: gettext('Relations'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, (selectedUserId) => {
                                        superdesk.entities.article.update({
                                            ...articleNext,
                                            marked_for_user: selectedUserId,
                                        });
                                    }));
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
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, (selectedUserId) => {
                                        superdesk.entities.article.update({
                                            ...articleNext,
                                            marked_for_user: selectedUserId,
                                        });
                                    }, articleNext.marked_for_user === null ? undefined : articleNext.marked_for_user));
                                },
                            };

                            const assigned = articleNext.marked_for_user != null;

                            if (assigned) {
                                return Promise.resolve([unmark, markForOtherUser]);
                            } else {
                                return Promise.resolve([markForUser]);
                            }
                        },
                        getActionsBulk: (_, articles: Array<IArticle>) => {
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
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, (selectedUserId) => {
                                        articles.forEach((article) => {
                                            superdesk.entities.article.update({
                                                ...article,
                                                marked_for_user: selectedUserId,
                                            });
                                        });
                                    }, selectedUserIdInitial, message));
                                },
                            }]);
                        },
                    },
                },
            },
        });
    },
};

export default extension;
