import {ISuperdesk, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getDisplayMarkedUserComponent} from './show-marked-user';
import {getActionsInitialize} from './get-article-actions';
import {getActionsBulkInitialize} from './get-article-actions-bulk';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const result: IExtensionActivationResult = {
            contributions: {
                articleListItemWidgets: [getDisplayMarkedUserComponent(superdesk)],
                authoringTopbarWidgets: [getDisplayMarkedUserComponent(superdesk)],
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
