import {ISuperdesk, IExtension, IExtensionActivationResult, IArticle} from 'superdesk-api';
import getTranslateWidgetComponent from './translate-widget';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;
        const label = gettext('Translate');
        console.log('Translate widget activated');

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [
                    {
                        _id: 'translate-widget',
                        label: label,
                        icon: 'translate',
                        order: 2,
                        component: getTranslateWidgetComponent(superdesk, label)
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
