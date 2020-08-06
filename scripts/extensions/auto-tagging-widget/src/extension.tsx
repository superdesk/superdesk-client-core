import {ISuperdesk, IExtension, IExtensionActivationResult} from 'superdesk-api';
import {getAutoTaggingComponent} from './auto-tagging';

const extension: IExtension = {
    id: 'autoTagging',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        const label = gettext('iMatrics tagging');

        const result: IExtensionActivationResult = {
            contributions: {
                authoringSideWidgets: [
                    {
                        label: label,
                        icon: 'marked-star',
                        order: 1,
                        component: getAutoTaggingComponent(superdesk, label),
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
