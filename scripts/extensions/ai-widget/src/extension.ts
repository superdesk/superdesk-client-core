import {IArticle, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {AiAssistantWidget, IStateAiWidget} from './ai-assistant';
import {superdesk} from './superdesk';
import {configuration} from './configuration';

export const AI_WIDGET_ID = 'ai-widget';

const extension: IExtension = {
    activate: () => {
        const hasConfiguredServices = Object.keys(configuration).length > 0;

        if (hasConfiguredServices === false) {
            superdesk.ui.notify.error('You haven\'t registered any services for the Ai Assistant Widget!', 5000);
            return Promise.resolve({});
        }

        const onTranslateAfterIntegration = (_original: IArticle, translation: IArticle) => {
            const initialState: IStateAiWidget = {
                currentTab: {
                    activeLanguageId: translation.language,
                    activeSection: 'translations',
                    error: false,
                    loading: true,
                    mode: 'other',
                    translation: '',
                },
            };

            superdesk.ui.article.edit(translation._id, {
                id: AI_WIDGET_ID,
                pinned: true,
                initialState: initialState,
            });

            superdesk.ui.notify.success(superdesk.localization.gettext('Item Translated'));
        };

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [{
                    _id: AI_WIDGET_ID,
                    component: AiAssistantWidget,
                    icon: 'open-ai',
                    label: superdesk.localization.gettext('Ai Assistant'),
                    order: 2,
                }],
                entities: {
                    article: configuration.translations?.translateActionIntegration === true ? {
                        onTranslateAfter: onTranslateAfterIntegration,
                    } : {},
                },
            },
        };

        return Promise.resolve(result);
    },
};

export {configure} from './configuration';

export default extension;
