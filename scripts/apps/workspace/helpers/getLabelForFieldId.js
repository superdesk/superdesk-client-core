import {LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';

export const getLabelNameResolver = () => ng.getServices(['gettext', 'content'])
    .then((services) => {
        const [gettext, content] = services;

        return content.getCustomFields()
            .then((customFields) => [gettext, customFields]);
    })
    .then((res) => {
        const [gettext, customFields] = res;

        return (fieldId) => {
            if (LABEL_MAP.hasOwnProperty(fieldId)) {
                return LABEL_MAP[fieldId];
            }

            const customField = customFields.find((obj) => obj._id === fieldId);

            if (
                customField != null
                && customField.hasOwnProperty('display_name')
                && customField['display_name'].length > 0
            ) {
                return customField['display_name'];
            }

            console.warn(`could not find label for ${fieldId}. Please add it in ` +
                '(apps/workspace/content/content/directives/ContentProfileSchemaEditor).' +
                'ContentProfileSchemaEditor/labelMap');

            return fieldId.charAt(0).toUpperCase() + fieldId.substr(1).toLowerCase();
        };
    });