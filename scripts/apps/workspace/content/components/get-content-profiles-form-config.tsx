import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {
    IFormField,
    IFormGroup,
    IContentProfileEditorConfig,
    FORMATTING_OPTION,
    RICH_FORMATTING_OPTION,
    ICommonFieldConfig,
    ISuperdeskGlobalConfig,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IContentProfileFieldWithSystemId} from './ContentProfileFieldsConfig';
import {appConfig, authoringReactViewEnabled} from 'appConfig';
import {nameof} from 'core/helpers/typescript-helpers';

const HAS_PLAINTEXT_FORMATTING_OPTIONS = Object.freeze({
    headline: true,
});

export const HAS_RICH_FORMATTING_OPTIONS = Object.freeze({
    abstract: true,
    body_html: true,
    footer: true,
    body_footer: true,
});

export type PLAINTEXT_FORMATTING_OPTION = 'uppercase' | 'lowercase';

export const getEditor3PlainTextFormattingOptions = (): Dictionary<PLAINTEXT_FORMATTING_OPTION, string> => ({
    'uppercase': gettext('uppercase'),
    'lowercase': gettext('lowercase'),
});

type IEnhancedTag = ISuperdeskGlobalConfig['authoring']['customEditorTags'][0] & {editor3Style: string}

export const customEditorTags: Array<IEnhancedTag> = (appConfig.authoring?.customEditorTags ?? []).map((item) => {
    return {
        ...item,
        editor3Style: `EDITOR_TAG_${item.id}`,
    };
});

export const getEditor3RichTextFormattingOptions = (): {[MEMBER in RICH_FORMATTING_OPTION]: string} => {
    return {
        ...Object.fromEntries((customEditorTags ?? []).map(({editor3Style, label}) => [editor3Style, label])),
        'h1': gettext('h1'),
        'h2': gettext('h2'),
        'h3': gettext('h3'),
        'h4': gettext('h4'),
        'h5': gettext('h5'),
        'h6': gettext('h6'),
        'unordered list': gettext('unordered list'),
        'ordered list': gettext('ordered list'),
        'pre': gettext('pre'),
        'quote': gettext('quote'),
        'media': gettext('media'),
        'link': gettext('link'),
        'superscript': gettext('superscript'),
        'subscript': gettext('subscript'),
        'strikethrough': gettext('strikethrough'),
        'underline': gettext('underline'),
        'italic': gettext('italic'),
        'bold': gettext('bold'),
        'table': gettext('table'),
        'multi-line quote': gettext('multi-line quote'),
        'custom blocks': gettext('custom blocks'),
        'formatting marks': gettext('formatting marks'),
        'remove format': gettext('remove format'),
        'remove all format': gettext('remove all format'),
        'annotation': gettext('annotation'),
        'comments': gettext('comments'),
        'suggestions': gettext('suggestions'),
        'embed': gettext('embed'),
        'embed articles': gettext('embed articles'),
        'tab': gettext('tab'),
        'tab as spaces': gettext('tab as space'),
        'undo': gettext('undo'),
        'redo': gettext('redo'),
        'uppercase': gettext('uppercase'),
        'lowercase': gettext('lowercase'),
    };
};

export const formattingOptionsUnsafeToParseFromHTML: Array<RICH_FORMATTING_OPTION> = [
    // these aren't outputted to HTML at all
    'comments',
    'suggestions',

    // no standard in HTML, parsing according to our output format is not implemented
    'annotation',

    // may not be parsed well
    'pre',
    'embed',
    'embed articles',
    'multi-line quote',
    'custom blocks',
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

function getEditor3FormattingOptions(
    fieldId: string,
    customFields: Array<any>,
): Dictionary<FORMATTING_OPTION | PLAINTEXT_FORMATTING_OPTION, string> {
    const isCustomPlainTextField = customFields.find(({_id}) => fieldId === _id)?.field_type === 'text';

    if (Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldId) || isCustomPlainTextField) {
        return getEditor3RichTextFormattingOptions();
    } else {
        return getEditor3PlainTextFormattingOptions();
    }
}

type IContentProfileFormField =
    IFormGroup<IContentProfileFieldWithSystemId> | IFormField<IContentProfileFieldWithSystemId>;

export function getContentProfileFormConfig(
    editor: IContentProfileEditorConfig,
    schema: any,
    customFields: Array<any>,
    field?: Partial<IContentProfileFieldWithSystemId> | undefined,
): IFormGroup<IContentProfileFieldWithSystemId> {
    const customField = field?.id != null ? customFields.find(({_id}) => field.id === _id) : null;

    const sdWidthField: IContentProfileFormField = {
        label: gettext('Width'),
        type: GenericFormFieldType.select,
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

    const requiredField: IContentProfileFormField = {
        label: gettext('Required'),
        type: GenericFormFieldType.checkbox,
        field: 'required',
        required: false,
    };

    const readonlyField: IContentProfileFormField = {
        label: gettext('Read-only'),
        type: GenericFormFieldType.checkbox,
        field: 'readonly',
        required: false,
    };

    const fields: Array<IContentProfileFormField> = [
        requiredField,
        readonlyField,
        sdWidthField,
    ];

    if (
        field?.id != null
        && (
            schema?.[field.id]?.type === 'string'
            || customField?.field_type === 'text'
        )
    ) {
        const minimumLengthField: IContentProfileFormField = {
            label: gettext('Minimum length'),
            type: GenericFormFieldType.number,
            field: 'minlength',
            required: false,
            component_parameters: {
                style: {boxed: true},
            },
        };

        const maximumLengthField: IContentProfileFormField = {
            label: gettext('Maximum length'),
            type: GenericFormFieldType.number,
            field: 'maxlength',
            required: false,
            component_parameters: {
                style: {boxed: true},
            },
        };

        const maximumSoftLengthField: IContentProfileFormField = {
            label: gettext('Maximum soft length'),
            type: GenericFormFieldType.number,
            field: 'maxSoftLength',
            required: false,
            component_parameters: {
                style: {boxed: true},
            },
        };

        const minMax: IContentProfileFormField = {
            direction: 'vertical',
            type: 'inline',
            form: [minimumLengthField, maximumLengthField, maximumSoftLengthField],
        };

        fields.push(minMax);
    }

    if (field?.id === 'dateline') {
        const hideDateField: IContentProfileFormField = {
            label: gettext('Hide Date'),
            type: GenericFormFieldType.checkbox,
            field: 'hideDate',
            required: false,
        };

        fields.push(hideDateField);
    }

    // enable preview config for CVs
    // we display other fields by default already
    if (field?.id != null && customField != null && customField.field_type == null) {
        const showInPreviewField: IContentProfileFormField = {
            label: gettext('Show in preview'),
            type: GenericFormFieldType.checkbox,
            field: 'preview',
            required: false,
        };

        fields.push(showInPreviewField);
    }

    if (field?.id != null && schema?.[field.id]?.type === 'string') {
        const cleanPastedHtmlField: IContentProfileFormField = {
            label: gettext('Clean Pasted HTML'),
            type: GenericFormFieldType.checkbox,
            field: 'cleanPastedHTML',
            required: false,
        };

        fields.push(cleanPastedHtmlField);
    }

    const characterValidationEnabled = appConfig?.disallowed_characters != null;

    /**
     * validate_characters switch doesn't make sense in authoring-react
     * because there is a dedicated config per field which chars are disallowed.
     */
    if (
        authoringReactViewEnabled
        && field?.id != null
        && characterValidationEnabled
        && (
            schema[field.id]?.type === 'string'
            || customField?.field_type === 'text'
        )
    ) {
        const validateCharactersField: IContentProfileFormField = {
            label: gettext('Validate Characters'),
            type: GenericFormFieldType.checkbox,
            field: 'validate_characters',
            required: false,
        };

        fields.push(validateCharactersField);
    }

    const formConfig: IContentProfileFormField = {
        direction: 'vertical',
        type: 'inline',
        form: fields,
    };

    if (field?.id != null && hasFormattingOptions(field.id, editor, customFields)) {
        const formattingOptionsEditor3Field: IContentProfileFormField = {
            label: gettext('Formatting options'),
            type: GenericFormFieldType.selectMultiple,
            field: 'formatOptions',
            required: false,
            component_parameters: {
                items: Object.entries(getEditor3FormattingOptions(field.id, customFields))
                    .map(([id, translatedLabel]) => ({id: id, label: translatedLabel})),
                dataTestId: 'formatting-options-input',
            },
        };

        fields.push(formattingOptionsEditor3Field);
    }

    if (field?.id != null && field.id === 'feature_media' && schema?.[field.id]?.type === 'media') {
        const showCropsField: IContentProfileFormField = {
            label: gettext('Show Crops'),
            type: GenericFormFieldType.checkbox,
            field: 'showCrops',
            required: false,
        };

        fields.push(showCropsField);
    }

    if (
        field?.id != null
        && (
            schema?.[field.id]?.type === 'media'
            || (
                hasFormattingOptions(field.id, editor, customFields)
                && field.formatOptions?.includes('media') === true
            )
        )
    ) {
        const showImageTitleField: IContentProfileFormField = {
            label: gettext('Show Image Title'),
            type: GenericFormFieldType.checkbox,
            field: 'imageTitle',
            required: false,
        };

        fields.push(showImageTitleField);
    }

    const showToggle: IContentProfileFormField = {
        label: gettext('Allow field to be toggled'),
        type: GenericFormFieldType.checkbox,
        field: nameof<ICommonFieldConfig>('allow_toggling'),
        required: false,
    };

    if (authoringReactViewEnabled) {
        fields.push(showToggle);
    }

    if (field?.id === 'sms') {
        const prefillSmsField: IContentProfileFormField = {
            label: gettext('Prefill the field with text from:'),
            type: GenericFormFieldType.select,
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
