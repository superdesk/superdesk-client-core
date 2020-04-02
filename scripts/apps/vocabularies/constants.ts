import {gettext} from 'core/utils';

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

export interface IVocabularySelectionType {
    id: string;
    label: string;
}

export interface IVocabularySelectionTypes {
    SINGLE_SELECTION: IVocabularySelectionType;
    MULTIPLE_SELECTION: IVocabularySelectionType;
    DO_NOT_SHOW: IVocabularySelectionType;
}

export function getVocabularySelectionTypes() {
    return {
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
}

export const DEFAULT_SCHEMA = {
    name: {},
    qcode: {},
    parent: {},
};
