import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {AiAssistantWidget} from './ai-assistant';
import {superdesk} from './superdesk';
import {configuration} from './configuration';

const extension: IExtension = {
    exposes: {
        get overrideTranslations() {
            return configuration.overrideTranslations;
        },
    },
    activate: () => {
        const hasConfiguredServices = Object.keys(configuration).length > 0;

        if (hasConfiguredServices === false) {
            superdesk.ui.notify.error('You haven\'t registered any services for the Ai Assistant Widget!', 5000);
            return Promise.resolve({});
        }

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [{
                    _id: 'ai-assistant',
                    component: AiAssistantWidget,
                    icon: 'open-ai',
                    label: superdesk.localization.gettext('Ai Assistant'),
                    order: 2,
                }],
            },
        };

        return Promise.resolve(result);
    },
};

export {configure} from './configuration';

export default extension;
