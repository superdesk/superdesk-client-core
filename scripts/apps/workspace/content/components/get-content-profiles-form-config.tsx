import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {
    IFormField,
    IFormGroup,
    IContentProfileEditorConfig,
    FORMATTING_OPTION,
    PLAINTEXT_FORMATTING_OPTION,
    RICH_FORMATTING_OPTION,
    IContentProfile,
    ICommonFieldConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IContentProfileFieldWithSystemId} from './ContentProfileFieldsConfig';
import {appConfig} from 'appConfig';
import {nameof} from 'core/helpers/typescript-helpers';

const HAS_PLAINTEXT_FORMATTING_OPTIONS = Object.freeze({
    headline: true,
});

const HAS_RICH_FORMATTING_OPTIONS = Object.freeze({
    abstract: true,
    body_html: true,
    footer: true,
    body_footer: true,
});

const FORMATTING_OPTIONS: Array<FORMATTING_OPTION> = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'justifyFull',
    'outdent',
    'indent',
    'unordered list',
    'ordered list',
    'pre',
    'quote',
    'media',
    'link',
    'superscript',
    'subscript',
    'strikethrough',
    'underline',
    'italic',
    'bold',
    'table',
];

const EDITOR3_PLAINTEXT_FORMATTING_OPTIONS: Array<PLAINTEXT_FORMATTING_OPTION> = [
    'uppercase',
    'lowercase',
];

export const EDITOR3_RICH_FORMATTING_OPTIONS: Array<RICH_FORMATTING_OPTION> = [
    ...EDITOR3_PLAINTEXT_FORMATTING_OPTIONS,
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ordered list',
    'unordered list',
    'quote',
    'media',
    'link',
    'embed',
    'underline',
    'italic',
    'bold',
    'table',
    'formatting marks',
    'remove format',
    'remove all format',
    'annotation',
    'comments',
    'suggestions',
    'pre',
    'superscript',
    'subscript',
    'strikethrough',
    'tab',
    'tab as spaces',
    'undo',
    'redo',
];

export const formattingOptionsUnsafeToParseFromHTML: Array<RICH_FORMATTING_OPTION> = [
    // these aren't outputted to HTML at all
    'comments',
    'suggestions',

    // no standard in HTML, parsing according to our output format is not implemented
    'annotation',

    // may not be parsed well
    'pre',
    'embed',
    'media',
    'table',
];

function hasFormattingOptions(fieldId: string, editor, customFields: Array<any>) {
    return Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldId)
        || (
            editor?.body_html?.editor3 === true
            && Object.keys(HAS_PLAINTEXT_FORMATTING_OPTIONS).includes(fieldId)
        )
        || customFields.find(({_id}) => fieldId === _id)?.field_type === 'text';
}

function getEditor3FormattingOptions(fieldId, customFields: Array<any>) {
    const isCustomPlainTextField = customFields.find(({_id}) => fieldId === _id)?.field_type === 'text';

    if (Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldId) || isCustomPlainTextField) {
        return EDITOR3_RICH_FORMATTING_OPTIONS;
    } else {
        return EDITOR3_PLAINTEXT_FORMATTING_OPTIONS;
    }
}

export function getContentProfileFormConfig(
    editor: IContentProfileEditorConfig,
    schema: any,
    customFields: Array<any>,
    field?: Partial<IContentProfileFieldWithSystemId> | undefined,
): IFormGroup {
    const customField = field?.id != null ? customFields.find(({_id}) => field.id === _id) : null;

    const sdWidthField: IFormField = {
        label: gettext('Width'),
        type: FormFieldType.select,
        component_parameters: {
            options: [
                {id: 'full', label: gettext('Full')},
                {id: 'half', label: gettext('Half')},
                {id: 'quarter', label: gettext('Quarter')},
            ],
            style: {boxed: true},
        },
        field: 'sdWidth',
        required: true,
    };

    const requiredField: IFormField = {
        label: gettext('Required'),
        type: FormFieldType.checkbox,
        field: 'required',
        required: false,
    };

    const readonlyField: IFormField = {
        label: gettext('Read-only'),
        type: FormFieldType.checkbox,
        field: 'readonly',
        required: false,
    };

    const fields: Array<IFormField | IFormGroup> = [
        requiredField,
        readonlyField,
        sdWidthField,
    ];

    if (
        field?.id != null
        && (
            schema[field.id].type === 'string'
            || customField?.field_type === 'text'
        )
    ) {
        const minimumLengthField: IFormField = {
            label: gettext('Minimum length'),
            type: FormFieldType.number,
            field: 'minlength',
            required: false,
            component_parameters: {
                style: {boxed: true},
            },
        };

        const maximumLengthField: IFormField = {
            label: gettext('Maximum length'),
            type: FormFieldType.number,
            field: 'maxlength',
            required: false,
            component_parameters: {
                style: {boxed: true},
            },
        };

        const minMax: IFormGroup = {
            direction: 'horizontal',
            type: 'inline',
            form: [minimumLengthField, maximumLengthField],
        };

        fields.push(minMax);
    }

    if (field?.id === 'dateline') {
        const hideDateField: IFormField = {
            label: gettext('Hide Date'),
            type: FormFieldType.checkbox,
            field: 'hideDate',
            required: false,
        };

        fields.push(hideDateField);
    }

    // enable preview config for CVs
    // we display other fields by default already
    if (field?.id != null && customField != null && customField.field_type == null) {
        const showInPreviewField: IFormField = {
            label: gettext('Show in preview'),
            type: FormFieldType.checkbox,
            field: 'preview',
            required: false,
        };

        fields.push(showInPreviewField);
    }

    if (field?.id != null && schema[field.id]?.type === 'string') {
        const cleanPastedHtmlField: IFormField = {
            label: gettext('Clean Pasted HTML'),
            type: FormFieldType.checkbox,
            field: 'cleanPastedHTML',
            required: false,
        };

        fields.push(cleanPastedHtmlField);
    }

    const characterValidationEnabled = appConfig?.disallowed_characters != null;

    if (
        field?.id != null
        && characterValidationEnabled
        && (
            schema[field.id]?.type === 'string'
            || customField?.field_type === 'text'
        )
    ) {
        const validateCharactersField: IFormField = {
            label: gettext('Validate Characters'),
            type: FormFieldType.checkbox,
            field: 'validate_characters',
            required: false,
        };

        fields.push(validateCharactersField);
    }

    const formConfig: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: fields,
    };

    if (field?.id != null && hasFormattingOptions(field.id, editor, customFields)) {
        const editor3Enabled = editor?.body_html?.editor3 === true;

        if (editor3Enabled) {
            const formattingOptionsEditor3Field: IFormField = {
                label: gettext('Formatting options'),
                type: FormFieldType.selectMultiple,
                field: 'formatOptions',
                required: false,
                component_parameters: {
                    items: getEditor3FormattingOptions(field.id, customFields)
                        .map((option) => ({id: option, label: option})),
                },
            };

            fields.push(formattingOptionsEditor3Field);
        } else {
            const formattingOptionsEditor2Field: IFormField = {
                label: gettext('Formatting options'),
                type: FormFieldType.selectMultiple,
                field: 'formatOptions',
                required: false,
                component_parameters: {
                    items: FORMATTING_OPTIONS.map((option) => ({id: option, label: option})),
                },
            };

            fields.push(formattingOptionsEditor2Field);
        }
    }

    if (field?.id != null && field.id === 'feature_media' && schema[field.id].type === 'media') {
        const showCropsField: IFormField = {
            label: gettext('Show Crops'),
            type: FormFieldType.checkbox,
            field: 'showCrops',
            required: false,
        };

        fields.push(showCropsField);
    }

    if (
        field?.id != null
        && (
            schema[field.id].type === 'media'
            || (
                hasFormattingOptions(field.id, editor, customFields)
                && field.formatOptions?.includes('media') === true
            )
        )
    ) {
        const showImageTitleField: IFormField = {
            label: gettext('Show Image Title'),
            type: FormFieldType.checkbox,
            field: 'imageTitle',
            required: false,
        };

        fields.push(showImageTitleField);
    }

    const showToggle: IFormField = {
        label: gettext('Allow field to be toggled'),
        type: FormFieldType.checkbox,
        field: nameof<ICommonFieldConfig>('allow_toggling'),
        required: false,
    };

    fields.push(showToggle);

    if (field?.id === 'sms') {
        const prefillSmsField: IFormField = {
            label: gettext('Prefill the field with text from:'),
            type: FormFieldType.select,
            component_parameters: {
                options: [
                    {id: '', label: gettext('Abstract')},
                    {id: 'headline', label: gettext('Headline')},
                ],
            },
            field: 'sourceField',
            required: false,
        };

        fields.push(prefillSmsField);
    }

    return formConfig;
}
