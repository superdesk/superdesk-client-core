export const MEDIA_TYPES = {
    GALLERY: {
        id: 'media',
        label: 'Media gallery'
    },
    RELATED_CONTENT: {
        id: 'related_content',
        label: 'Related items'
    },
};

export const MEDIA_TYPE_KEYS = Object.keys(MEDIA_TYPES).map((type) => MEDIA_TYPES[type].id);

export const DEFAULT_SCHEMA = {
    name: {},
    qcode: {},
    parent: {},
};
