import {IExtension, IExtensionActivationResult} from 'superdesk-api';
import {AvailabilitySettings} from './availability-settings';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                getUserProfileSections: () => [
                    {
                        id: 'availability',
                        label: gettext('Availability'),
                        priority: 5,
                        component: AvailabilitySettings,
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
