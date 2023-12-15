import {ISuperdesk, IExtension, IExtensionActivationResult, IArticle} from 'superdesk-api';
import {getAutoTaggingComponent} from './auto-tagging';
import {getHeaderAutoTaggingComponent} from './header-auto-tagging';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;
        const label = gettext('Autotagger');

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [
                    {
                        _id: 'auto-tagging-widget',
                        label: label,
                        icon: 'tag',
                        order: 1,
                        component: getAutoTaggingComponent(superdesk, label),
                        isAllowed: (item: IArticle) => item.type === 'text',
                    },
                ],
                authoringHeaderComponents: [
                    {
                        _id: 'header-component',
                        label: gettext('Tags'),
                        order: 40,
                        component: getHeaderAutoTaggingComponent(superdesk),
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
