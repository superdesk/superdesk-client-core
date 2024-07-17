import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IMonitoringFilter,
    IPersonalSpaceSection,
} from 'superdesk-api';
import {getDisplayMarkedUserComponent} from './show-marked-user';
import {getActionsInitialize} from './get-article-actions';
import {getActionsBulkInitialize} from './get-article-actions-bulk';
import {getMarkedForMeComponent} from './get-marked-for-me-component';
import {getQueryMarkedForUser, getQueryNotMarkedForAnyoneOrMarkedForMe} from './get-article-queries';

const extension: IExtension = {
    exposes: {
        getQueryNotMarkedForAnyoneOrMarkedForMe,
        getQueryMarkedForUser,
    },
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return superdesk.session.getCurrentUser().then((user) => {
            const personalSpaceSections: Array<IPersonalSpaceSection> = [
                {
                    id: 'markedForMe',
                    label: gettext('Marked for me'),
                    query: {
                        term: {
                            marked_for_user: user._id,
                        },
                    },
                },
            ];
            const result: IExtensionActivationResult = {
                contributions: {
                    globalMenuHorizontal: [getMarkedForMeComponent(superdesk)],
                    articleListItemWidgets: [getDisplayMarkedUserComponent(superdesk)],
                    authoringTopbarWidgets: [
                        {
                            component: getDisplayMarkedUserComponent(superdesk),
                            availableOffline: false,
                            priority: 0.1,
                            group: 'start',
                        },
                    ],
                    personalSpace: {
                        getSections: () => personalSpaceSections,
                    },
                    notifications: {
                        'item:marked': {
                            type: 'desktop',
                            label: gettext('open item'),
                            handler: (notification: any) => ({
                                body: notification.message,
                                actions: [{
                                    label: gettext('open item'),
                                    onClick: () => superdesk.ui.article.view(notification.item),
                                }],
                            }),
                        },
                        'item:unmarked': {
                            label: gettext('open item'),
                            type: 'desktop',
                            handler: (notification: any) => ({
                                body: notification.message,
                                actions: [{
                                    label: gettext('open item'),
                                    onClick: () => superdesk.ui.article.view(notification.item),
                                }],
                            }),
                        },
                        'mark_for_user:notification': {
                            type: 'email',
                        }
                    },
                    entities: {
                        article: {
                            getActions: getActionsInitialize(superdesk),
                            getActionsBulk: getActionsBulkInitialize(superdesk),
                        },
                    },
                    monitoring: {
                        getFilteringButtons: (deskId: string) => {
                            const items: Array<IMonitoringFilter> = [
                                {
                                    label: gettext('Marked for me'),
                                    query: {
                                        marked_for_user: [user._id],
                                        'task.desk': [deskId],
                                    },
                                    displayOptions: {
                                        ignoreMatchesInSavedSearchMonitoringGroups: true,
                                    },
                                },
                            ];

                            return items;
                        },
                    },
                },
            };

            return Promise.resolve(result);
        });
    },
};

export default extension;
