import {OrderedMap} from 'immutable';
import {
    IAttachmentsConfig,
    IAuthoringFieldV2,
    IContentProfileV2,
    IDropdownConfigVocabulary,
    IEditor3Config,
} from 'superdesk-api';
import {SUBITEMS_FIELD_TYPE} from '../authoring-fields/subitems/constants';
import {
    CAMERA,
    RUNDOWN_ITEM_TYPES_VOCABULARY_ID,
    STATUS_VOCABULARY_ID,
} from '../constants';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {vocabulary} = superdesk.entities;

const editor3TestConfigWithFormatting: IEditor3Config = {
    editorFormat: [
        'bold',
        'italic',
        'underline',
        'link',
        'h2',
        'h3',
        'ordered list',
        'unordered list',
        'strikethrough',
        'quote',
        'remove format',
        'remove all format',
        'comments',
        'annotation',
        'suggestions',
        'undo',
        'redo',
        'uppercase',
        'lowercase',
    ],
    minLength: undefined,
    maxLength: undefined,
    cleanPastedHtml: false,
    singleLine: true,
    disallowedCharacters: [],
    showStatistics: false,
};

const titleField: IAuthoringFieldV2 = {
    id: 'title',
    name: gettext('Title'),
    fieldType: 'editor3',
    fieldConfig: {
        ...editor3TestConfigWithFormatting,
        required: true,
    },
};

const technicalTitle: IAuthoringFieldV2 = {
    id: 'technical_title',
    name: gettext('Tech. title'),
    fieldType: 'editor3',
    fieldConfig: {
        ...editor3TestConfigWithFormatting,
        readOnly: true,
    },
};

const contentFieldConfig: IEditor3Config = {
    ...editor3TestConfigWithFormatting,
    singleLine: false,
};

const contentField: IAuthoringFieldV2 = {
    id: 'content',
    name: gettext('Content'),
    fieldType: 'editor3',
    fieldConfig: contentFieldConfig,
};

const itemTypesConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: RUNDOWN_ITEM_TYPES_VOCABULARY_ID,
    multiple: false,
};

const itemTypeField: IAuthoringFieldV2 = {
    id: 'item_type',
    name: vocabulary.getVocabulary(itemTypesConfig.vocabularyId).display_name,
    fieldType: 'dropdown',
    fieldConfig: itemTypesConfig,
};

const cameraConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: CAMERA,
    multiple: true,
};

const cameraField: IAuthoringFieldV2 = {
    id: 'camera',
    name: gettext('Camera'),
    fieldType: 'dropdown',
    fieldConfig: cameraConfig,
};

const durationField: IAuthoringFieldV2 = {
    id: 'duration',
    name: gettext('Duration'),
    fieldType: 'duration',
    fieldConfig: {},
};

const plannedDurationField: IAuthoringFieldV2 = {
    id: 'planned_duration',
    name: gettext('Planned duration'),
    fieldType: 'duration',
    fieldConfig: {},
};

const subitemAttachmentsConfig: IAttachmentsConfig = {};

const subitemAttachments: IAuthoringFieldV2 = {
    id: 'subitem_attachments',
    name: gettext('Subitem attachments'),
    fieldType: 'attachments',
    fieldConfig: subitemAttachmentsConfig,
};

const statusConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: STATUS_VOCABULARY_ID,
    multiple: false,
};

const statusField: IAuthoringFieldV2 = {
    id: 'status',
    name: gettext('Status'),
    fieldType: 'dropdown',
    fieldConfig: statusConfig,
};

const subitemsField: IAuthoringFieldV2 = {
    id: 'subitems',
    name: gettext('Subitems'),
    fieldType: SUBITEMS_FIELD_TYPE,
    fieldConfig: {},
};

export const rundownItemContentProfile: IContentProfileV2 = {
    id: 'temp-profile',
    name: 'Temporary profile',
    header: OrderedMap([
        [technicalTitle.id, technicalTitle],
        [itemTypeField.id, itemTypeField],
        [cameraField.id, cameraField],
        [statusField.id, statusField],
        [durationField.id, durationField],
        [plannedDurationField.id, plannedDurationField],
    ]),
    content: OrderedMap([
        [titleField.id, titleField],
        [contentField.id, contentField],
        [subitemsField.id, subitemsField],
        [subitemAttachments.id, subitemAttachments],
    ]),
};
