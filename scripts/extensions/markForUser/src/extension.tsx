import {ISuperdesk, IExtension, IArticleAction} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';

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
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, articleNext));
                                },
                            };

                            const unmark: IArticleAction = {
                                label: gettext('Unmark'),
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
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, articleNext));
                                },
                            };

                            const assigned = articleNext.marked_for_user != null;

                            if (assigned) {
                                return Promise.resolve([unmark, markForOtherUser]);
                            } else {
                                return Promise.resolve([markForUser]);
                            }
                        },
                    },
                },
            },
        });
    },
};

export default extension;
