import {IExtension, IExtensionActivationResult, IUserProfileSection} from 'superdesk-api';
import {LANGUAGES_VOCABULARY, privileges, TAGS_VOCABULARY_ID} from './constants';
import {AvailabilitySettingsPage} from './settings/availability-settings-page';
import {superdesk} from './superdesk';
import {CorrespondentAvailability} from './correspondent-availability';
import {configuration} from './configuration';

const {gettext} = superdesk.localization;

const extension: IExtension = {
    activate: () => {
        const vocabularies = superdesk.entities.vocabulary.getAll();

        const extensionStartErrors = (() => {
            const errors: Array<string> = [];

            if (vocabularies.get(TAGS_VOCABULARY_ID) == null) {
                errors.push(
                    gettext(
                        'Availability manager extension could not start because vocabulary "{{id}}" is missing',
                        {id: TAGS_VOCABULARY_ID},
                    ),
                );
            }

            if (vocabularies.get(LANGUAGES_VOCABULARY) == null) {
                errors.push(
                    gettext(
                        'Availability manager extension could not start because vocabulary "{{id}}" is missing',
                        {id: LANGUAGES_VOCABULARY},
                    ),
                );
            }

            return errors;
        })();

        const contributions: IExtensionActivationResult['contributions'] = {
            getInstanceConfigurationIssues: () => {
                return Promise.resolve(extensionStartErrors.map((error) => ({message: error})));
            },
        };

        if (extensionStartErrors.length < 1) {
            if (superdesk.privileges.hasPrivilege(privileges.user_availability_manage_own)) {
                contributions.getUserProfileSections = (user) => {
                    const result: Array<IUserProfileSection> = [];

                    if (
                        user._id === superdesk.session.getCurrentUserId()
                        || superdesk.privileges.hasPrivilege(privileges.user_availability_manage)
                    ) {
                        result.push({
                            id: 'availability',
                            label: gettext('Availability'),
                            priority: 5,
                            component: AvailabilitySettingsPage,
                        });
                    }

                    return result;
                };
            }

            if (superdesk.privileges.hasPrivilege(privileges.user_availability)) {
                if (contributions.pages == null) {
                    contributions.pages = [];
                }

                const addToSideMenu = configuration?.dashboard?.addLinkToSideMenu ?? undefined;

                contributions.pages.push({
                    title: gettext('Availability Management'),
                    url: '/availability-management',
                    priority: 160,
                    component: CorrespondentAvailability,
                    addToSideMenu: addToSideMenu,
                    addToMainMenu: addToSideMenu == null,
                    showSideMenu: addToSideMenu != null,
                });
            }
        }

        return Promise.resolve({contributions} satisfies IExtensionActivationResult);
    },
};

export {configure} from './configuration';

export default extension;
