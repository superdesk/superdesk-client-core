import {IExtension, IExtensionActivationResult, IUserProfileSection} from 'superdesk-api';
import {LANGUAGES_VOCABULARY, TAGS_VOCABULARY_ID} from './constants';
import {AvailabilitySettings} from './settings';
import {superdesk} from './superdesk';
import {CorrespondentAvailability} from './correspondent-availability';

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
            contributions.getUserProfileSections = (user) => {
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
            };

            if (superdesk.privileges.hasPrivilege('user_availability')) {
                if (contributions.pages == null) {
                    contributions.pages = [];
                }

                contributions.pages.push({
                    title: 'Correspondent availability',
                    url: '/correspondent-availability',
                    priority: 160,
                    component: CorrespondentAvailability,
                });
            }
        }

        return Promise.resolve({contributions} satisfies IExtensionActivationResult);
    },
};

export default extension;
