// Adding the following because planning webpack when compiled for test cases
// won't be aware of gettext.
const gettext = _.get(window, 'gettext', (text) => text);

export const MEDIA_TYPES = {
    GALLERY: {
        id: 'media',
        label: gettext('Media gallery')
    },
    RELATED_CONTENT: {
        id: 'related_content',
        label: gettext('Related items')
    },
};

export const MEDIA_TYPE_KEYS = Object.keys(MEDIA_TYPES).map((type) => MEDIA_TYPES[type].id);

export const DEFAULT_SCHEMA = {
    name: {},
    qcode: {},
    parent: {},
};
