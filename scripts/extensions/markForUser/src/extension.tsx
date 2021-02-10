import {ISuperdesk, IExtension, IExtensionActivationResult, IArticle, IMonitoringFilter} from 'superdesk-api';
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
    id: 'markForUser',
    exposes: {
        getQueryNotMarkedForAnyoneOrMarkedForMe,
        getQueryMarkedForUser,
    },
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        const result: IExtensionActivationResult = {
            contributions: {
                globalMenuHorizontal: [getMarkedForMeComponent(superdesk)],
                articleListItemWidgets: [getDisplayMarkedUserComponent(superdesk)],
                authoringTopbarWidgets: [getDisplayMarkedUserComponent(superdesk)],
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
                    getFilteringButtons: (deskId: string) => superdesk.session.getCurrentUser().then((user) => {
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
                    }),
                },
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
