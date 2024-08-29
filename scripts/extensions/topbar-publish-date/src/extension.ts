import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {DisplayPublishedTime} from './publish-date';

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                authoringTopbar2Widgets: [DisplayPublishedTime],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
