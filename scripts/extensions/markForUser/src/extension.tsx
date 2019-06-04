import {ISuperdesk, IExtension} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                entities: {
                    article: {
                        getActions: (articleNext) => {
                            const markForUser = {
                                label: gettext('Mark for user'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    superdesk.ui.showModal(getMarkForUserModal(superdesk, articleNext));
                                },
                            };

                            const unmark = {
                                label: gettext('Unmark'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    console.log('test');
                                },
                            };

                            const markForOtherUser = {
                                label: gettext('Mark for other user'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    console.log('test');
                                },
                            };

                            const assigned = Object.keys(articleNext).includes('marked_for_user');

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
