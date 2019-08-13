import {ISuperdesk, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getDisplayMarkedUserComponent} from './show-marked-user';
import {getActionsInitialize} from './get-article-actions';
import {getActionsBulkInitialize} from './get-article-actions-bulk';
import {getActionsExtraInitialize} from './get-article-actions-extra';
import {getMarkedForMeComponent} from './get-marked-for-me-component';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const result: IExtensionActivationResult = {
            contributions: {
                globalMenuHorizontal: [getMarkedForMeComponent(superdesk)],
                articleListItemWidgets: [getDisplayMarkedUserComponent(superdesk)],
                authoringTopbarWidgets: [getDisplayMarkedUserComponent(superdesk)],
                entities: {
                    article: {
                        getActions: getActionsInitialize(superdesk),
                        getActionsBulk: getActionsBulkInitialize(superdesk),
                        getActions: getActionsExtraInitialize(superdesk),
                    },
                },
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
