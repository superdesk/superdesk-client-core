import {LABEL_MAP} from '../content/constants';

export function getLabelForFieldId(id, content) {
    if (LABEL_MAP.hasOwnProperty(id)) {
        return LABEL_MAP[id];
    }

    const customField = content.allFields().find((obj) => obj._id === id);

    if (customField != null && customField.hasOwnProperty('display_name') && customField['display_name'].length > 0) {
        return customField['display_name'];
    }

    console.warn(`could not find label for ${id}. Please add it in ` +
        '(apps/workspace/content/content/directives/ContentProfileSchemaEditor).' +
        'ContentProfileSchemaEditor/labelMap');

    return id.charAt(0).toUpperCase() + id.substr(1).toLowerCase();
}