import {GET_LABEL_MAP} from '../content/constants';
import ng from 'core/services/ng';

export const getLabelNameResolver = () => ng.getServices(['gettextCatalog', 'content'])
    .then((services) => {
        const [gettextCatalog, content] = services;
        const gettext = (str) => gettextCatalog.getString(str);

        return content.getCustomFields()
            .then((customFields) => [gettext, customFields]);
    })
    .then((res) => {
        const [gettext, customFields] = res;

        const labelMap = GET_LABEL_MAP(gettext);

        return (fieldId) => {
            if (labelMap.hasOwnProperty(fieldId)) {
                return labelMap[fieldId];
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