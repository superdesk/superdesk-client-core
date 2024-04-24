import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import getAiAssistantWidget from './ai-assistant';

const extension: IExtension = {
    activate: (superdesk) => {
        const {gettext} = superdesk.localization;
        const label = gettext('Ai Assistant');

        const result: IExtensionActivationResult = {
                contributions: {
                    authoringSideWidgets: [{
                        _id: 'ai-assistant',
                        component: getAiAssistantWidget(superdesk, label),
                        icon: 'open-ai',
                        label: superdesk.localization.gettext('Ai Assistant'),
                        order: 2,
                    }]
                },
            };

        return Promise.resolve(result);
    },
};

export {setRequests} from './requests';

export default extension;
