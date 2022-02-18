import {ISuperdesk, IExtension, IExtensionActivationResult, IArticle} from 'superdesk-api';
import {getAutoTaggingComponent} from './auto-tagging';
import {getHeaderAutoTaggingComponent} from './header-auto-tagging';

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        const label = gettext('iMatrics tagging');

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [
                    {
                        _id: 'imatrics-auto-tagging-widget',
                        label: label,
                        icon: 'tag',
                        order: 1,
                        component: getAutoTaggingComponent(superdesk, label),
                        isAllowed: (item: IArticle) => item.type === 'text',
                    },
                ],
                authoringHeaderComponents: [
                    {
                        _id: 'imatrics-header-component',
                        label: gettext('iMatrics'),
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
