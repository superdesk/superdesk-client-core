import {get} from 'lodash';
// Adding the following because planning webpack when compiled for test cases
// won't be aware of gettext.
const gettext = get(window, 'gettext', (text) => text);

export const MEDIA_TYPES = {
    GALLERY: {
        id: 'media',
        label: gettext('Media gallery'),
    },
    RELATED_CONTENT: {
        id: 'related_content',
        label: gettext('Related items'),
    },
};

export const MEDIA_TYPE_KEYS = Object.keys(MEDIA_TYPES).map((type) => MEDIA_TYPES[type].id);

export const VOCABULARY_SELECTION_TYPES = {
    SINGLE_SELECTION: {
        id: 'single selection',
        label: gettext('Single selection'),
    },
    MULTIPLE_SELECTION: {
        id: 'multi selection',
        label: gettext('Multi selection'),
    },
    DO_NOT_SHOW: {
        id: 'do not show',
        label: gettext('Do not show'),
    },
};

export const DEFAULT_SCHEMA = {
    name: {},
    qcode: {},
    parent: {},
};
