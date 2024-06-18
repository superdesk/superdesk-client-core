import {IArticle, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {AiAssistantWidget, IStateTranslationsTab} from './ai-assistant';
import {superdesk} from './superdesk';
import {configuration} from './configuration';

const extension: IExtension = {
    activate: () => {
        const hasConfiguredServices = Object.keys(configuration).length > 0;

        if (hasConfiguredServices === false) {
            superdesk.ui.notify.error('You haven\'t registered any services for the Ai Assistant Widget!', 5000);
            return Promise.resolve({});
        }

        const onTranslateAfterIntegration = (_original: IArticle, translation: IArticle) => {
            const initialState: IStateTranslationsTab = {
                activeLanguageId: translation.language,
                activeSection: 'translations',
                error: false,
                loading: true,
                mode: 'other',
                translation: '',
            };

            superdesk.ui.article.edit(translation._id, {
                id: 'ai-widget',
                pinned: true,
                initialState: initialState,
            });

            superdesk.ui.notify.success(superdesk.localization.gettext('Item Translated'));
        };

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [{
                    _id: 'ai-widget',
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
