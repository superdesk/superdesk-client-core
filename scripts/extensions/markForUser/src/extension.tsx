import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IArticle,
    IMonitoringFilter,
    IPersonalSpaceSection,
} from 'superdesk-api';
import {getDisplayMarkedUserComponent} from './show-marked-user';
import {getActionsInitialize} from './get-article-actions';
import {getActionsBulkInitialize} from './get-article-actions-bulk';
import {getMarkedForMeComponent} from './get-marked-for-me-component';
import {getQueryMarkedForUser, getQueryNotMarkedForAnyoneOrMarkedForMe} from './get-article-queries';

interface IMarkForUserNotification {
    message: string;
    item: IArticle['_id'];
}

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
                        'item:marked': (notification: IMarkForUserNotification) => {
                            return {
                                body: notification.message,
                                actions: [
                                    {
                                        label: gettext('open item'),
                                        onClick: () => superdesk.ui.article.view(notification.item),
                                    },
                                ],
                            };
                        },
                        'item:unmarked': (notification: IMarkForUserNotification) => {
                            return {
                                body: notification.message,
                                actions: [
                                    {
                                        label: gettext('open item'),
                                        onClick: () => superdesk.ui.article.view(notification.item),
                                    },
                                ],
                            };
                        },
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
