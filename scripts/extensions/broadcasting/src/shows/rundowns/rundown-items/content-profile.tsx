import {OrderedMap} from 'immutable';
import {
    IAttachmentsConfig,
    IAuthoringFieldV2,
    IContentProfileV2,
    IDropdownConfigVocabulary,
    IEditor3Config,
    RICH_FORMATTING_OPTION,
} from 'superdesk-api';
import {
    CAMERA,
    RUNDOWN_ITEM_TYPES_VOCABULARY_ID,
    RUNDOWN_SUBITEM_TYPES,
    SHOW_PART_VOCABULARY_ID,
    STATUS_VOCABULARY_ID,
} from '../../../constants';
import {superdesk} from '../../../superdesk';

const {gettext} = superdesk.localization;
const {vocabulary} = superdesk.entities;

const testEditorFormat: Array<RICH_FORMATTING_OPTION> = [
    'uppercase',
    'lowercase',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ordered list',
    'unordered list',
    'quote',
    'link',
    'embed',
    'underline',
    'italic',
    'bold',
    'annotation',
    'comments',
    'pre',
    'superscript',
    'subscript',
    'strikethrough',
];

const editor3TestConfig: IEditor3Config = {
    editorFormat: testEditorFormat,
    minLength: undefined,
    maxLength: undefined,
    cleanPastedHtml: false,
    singleLine: false,
    disallowedCharacters: [],
};

const editor3TestConfigWithoutFormatting: IEditor3Config = {
    editorFormat: [],
    minLength: undefined,
    maxLength: undefined,
    cleanPastedHtml: false,
    singleLine: true,
    disallowedCharacters: [],
};

const titleField: IAuthoringFieldV2 = {
    id: 'title',
    name: gettext('Title'),
    fieldType: 'editor3',
    fieldConfig: {
        ...editor3TestConfigWithoutFormatting,
        required: true,
    },
};

const technicalTitle: IAuthoringFieldV2 = {
    id: 'technical_title',
    name: gettext('Tech. title'),
    fieldType: 'editor3',
    fieldConfig: {
        ...editor3TestConfigWithoutFormatting,
        readOnly: true,
    },
};

const contentField: IAuthoringFieldV2 = {
    id: 'content',
    name: gettext('Content'),
    fieldType: 'editor3',
    fieldConfig: editor3TestConfig,
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
    multiple: false,
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
    fieldConfig: {
        required: true,
    },
};

const additionalNotesField: IAuthoringFieldV2 = {
    id: 'additional_notes',
    name: gettext('Additional notes'),
    fieldType: 'editor3',
    fieldConfig: editor3TestConfigWithoutFormatting,
};

const currentShowCode = 'ABC'; // FINISH: remove test data

const showPartConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: SHOW_PART_VOCABULARY_ID,
    multiple: false,
    filter: (item) => item['show_reference'] == null || item['show_reference'] === currentShowCode,
};

const showPartField: IAuthoringFieldV2 = {
    id: 'show_part',
    name: gettext('Show part'),
    fieldType: 'dropdown',
    fieldConfig: showPartConfig,
};

const subitemsConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: RUNDOWN_SUBITEM_TYPES,
    multiple: true,
};

const subItemsField: IAuthoringFieldV2 = {
    id: 'subitems',
    name: gettext('Subitems'),
    fieldType: 'dropdown',
    fieldConfig: subitemsConfig,
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

export const rundownItemContentProfile: IContentProfileV2 = {
    id: 'temp-profile',
    name: 'Temporary profile',
    header: OrderedMap([
        [technicalTitle.id, technicalTitle],
        [itemTypeField.id, itemTypeField],
        [showPartField.id, showPartField],
        [cameraField.id, cameraField],
        [subItemsField.id, subItemsField],
        [statusField.id, statusField],
        [durationField.id, durationField],
        [plannedDurationField.id, plannedDurationField],
    ]),
    content: OrderedMap([
        [titleField.id, titleField],
        [subitemAttachments.id, subitemAttachments],
        [contentField.id, contentField],
        [additionalNotesField.id, additionalNotesField],
    ]),
};
