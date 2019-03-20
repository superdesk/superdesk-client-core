export const fieldsMetaKeys = {
    draftjsState: 'draftjsState',
};

// . is not a valid character for mongo key
export const FIELD_KEY_SEPARATOR = '>';

export const getFieldId = (contentKey) => contentKey.split(FIELD_KEY_SEPARATOR).slice(-1)[0];

export const META_FIELD_NAME = 'fields_meta';

const wrapper = {
    // wrapping is performed, so backend API doesn't try to merge the keys of our value

    wrap: (value) => [value],
    unwrap: (wrappedValue) => wrappedValue[0],
};

// Content key is similar to fieldName, except it supports nested objects
// which have content keys like such "extra>customFieldName"
export function getFieldMetadata(item, fieldKey, contentKey) {
    if (Object.keys(fieldsMetaKeys).includes(contentKey) === false) {
        throw new Error(`Invalid key '${contentKey}'`);
    }

    if (item == null || item[META_FIELD_NAME] == null || item[META_FIELD_NAME][fieldKey] == null) {
        return null;
    }

    if (Array.isArray(item[META_FIELD_NAME][fieldKey][contentKey]) === false) {
        return null;
    }

    return wrapper.unwrap(item[META_FIELD_NAME][fieldKey][contentKey]);
}

export function setFieldMetadata(item, fieldKey, contentKey, contentValue) {
    if (Object.keys(fieldsMetaKeys).includes(contentKey) === false) {
        throw new Error('Invalid key');
    }

    if (item[META_FIELD_NAME] == null) {
        item[META_FIELD_NAME] = {};
    }

    item[META_FIELD_NAME][fieldKey] = {
        ...item[META_FIELD_NAME][fieldKey],
        [contentKey]: wrapper.wrap(contentValue),
    };
}
