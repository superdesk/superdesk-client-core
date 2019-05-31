import {ISuperdesk, IExtension} from 'superdesk-api';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                entities: {
                    article: {
                        getActions: (item) => {
                            const assignTo = {
                                label: gettext('Assign to'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    console.log('test');
                                },
                            };

                            const unassign = {
                                label: gettext('Unassign'),
                                icon: 'icon-assign',
                                onTrigger: () => {
                                    console.log('test');
                                },
                            };

                            const assigned = Object.keys(item).includes('assigned');

                            if (assigned) {
                                return Promise.resolve([unassign]);
                            } else {
                                return Promise.resolve([assignTo]);
                            }
                        },
                    },
                },
            },
        });
    },
};

export default extension;
