import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getPublishDate} from './publish-date';

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                authoringTopbar2Widgets: [getPublishDate()],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
