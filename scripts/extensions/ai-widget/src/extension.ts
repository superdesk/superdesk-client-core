import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {AiAssistantWidget} from './ai-assistant';
import {superdesk} from './superdesk';
import {configuration} from './configuration';

const extension: IExtension = {
    exposes: {
        get translateActionIntegration(): boolean {
            return configuration.translations?.translateActionIntegration ?? false;
        },
    },
    activate: () => {
        const hasConfiguredServices = Object.keys(configuration).length > 0;

        if (hasConfiguredServices === false) {
            superdesk.ui.notify.error('You haven\'t registered any services for the Ai Assistant Widget!', 5000);
            return Promise.resolve({});
        }

        const onTranslateAfter: IExtensionActivationResult['contributions'] = configuration.translations?.translateActionIntegration ? {
                entities: {
                    article: {
                        onTranslateAfter: (_original, translation) => {
                            superdesk.ui.article.edit(translation._id, {
                                id: 'ai-widget',
                                pinned: true,
                                initialState: {
                                    activeTab: 'translations',
                                    mode: 'other',
                                },
                            });
                        }
                    }
                }
        } : {};

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [{
                    _id: 'ai-widget',
                    component: AiAssistantWidget,
                    icon: 'open-ai',
                    label: superdesk.localization.gettext('Ai Assistant'),
                    order: 2,
                }],
                ...onTranslateAfter,
            },
        };

        return Promise.resolve(result);
    },
};

export {configure} from './configuration';

export default extension;
