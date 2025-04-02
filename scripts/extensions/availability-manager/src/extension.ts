import {IExtension, IExtensionActivationResult, IUserProfileSection} from 'superdesk-api';
import {AvailabilitySettings} from './settings';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                getUserProfileSections: (user) => {
                    const result: Array<IUserProfileSection> = [];

                    // Availability widget is only available to edit own user
                    if (user._id === superdesk.session.getCurrentUserId()) {
                        result.push({
                            id: 'availability',
                            label: gettext('Availability'),
                            priority: 5,
                            component: AvailabilitySettings,
                        });
                    }

                    return result;
                },
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
