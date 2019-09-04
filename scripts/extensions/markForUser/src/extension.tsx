import {ISuperdesk, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getDisplayMarkedUserComponent} from './show-marked-user';
import {getActionsInitialize} from './get-article-actions';
import {getActionsBulkInitialize} from './get-article-actions-bulk';
import {authoringActionsInitialize} from './get-authoring-actions';
import {getMarkedForMeComponent} from './get-marked-for-me-component';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const result: IExtensionActivationResult = {
            contributions: {
                globalMenuHorizontal: [getMarkedForMeComponent(superdesk)],
                articleListItemWidgets: [getDisplayMarkedUserComponent(superdesk)],
                authoringTopbarWidgets: [getDisplayMarkedUserComponent(superdesk)],
                authoringActions: authoringActionsInitialize(superdesk),
                entities: {
                    article: {
                        getActions: getActionsInitialize(superdesk),
                        getActionsBulk: getActionsBulkInitialize(superdesk),
                    },
                },
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
