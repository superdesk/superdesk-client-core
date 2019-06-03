import {ISuperdesk, IExtension} from 'superdesk-api';

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
                                    superdesk.entities.article.update({
                                        ...articleNext,
                                        marked_for_user: '5b8e8193149f112ab9b9d974',
                                    });
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

                            const assigned = Object.keys(articleNext).includes('assigned');

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
