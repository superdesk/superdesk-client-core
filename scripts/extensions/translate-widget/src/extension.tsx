import {ISuperdesk, IExtension, IExtensionActivationResult, IArticle} from 'superdesk-api';
import TranslateWidget from './translate-widget';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;
        const label = gettext('Translate');

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [
                    {
                        _id: 'translate-widget',
                        label: label,
                        icon: 'translate',
                        order: 1,
                        component: TranslateWidget(superdesk, label),
                        isAllowed: (item: IArticle) => item.type === 'text',
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
