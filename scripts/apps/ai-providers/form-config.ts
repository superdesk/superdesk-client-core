import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import type {ISelectAsyncParameters} from 'core/ui/components/generic-form/input-types/select-async';
import {gettext} from 'core/utils';
import type {IFormField, IFormGroup} from 'superdesk-api';
import {getProviderModels} from './api';
import type {IAIProvider, IAIProviderType} from './interfaces';

/** Labels are lazy so `gettext` runs after translations load, and the extractor still sees a literal. */
export const AI_PROVIDER_TYPES: Array<{id: IAIProviderType; getLabel: () => string}> = [
    {id: 'openai_compatible', getLabel: () => gettext('OpenAI compatible')},
];

export function getNameField(): IFormField<IAIProvider> {
    return {
        label: gettext('Name'),
        type: GenericFormFieldType.plainText,
        field: 'name',
        required: true,
    };
}

/**
 * `api_key` is required on create and optional on edit, where it doubles as key rotation: the
 * server reads an omitted or empty `api_key` in a PATCH as "keep the stored one".
 */
export function getAiProviderFormConfig(item?: Partial<IAIProvider>): IFormGroup<IAIProvider> {
    const isExistingProvider = item?._id != null;

    const providerTypeField: IFormField<IAIProvider> = {
        label: gettext('Provider type'),
        type: GenericFormFieldType.select,
        field: 'provider_type',
        required: true,
        component_parameters: {
            options: AI_PROVIDER_TYPES.map(({id, getLabel}) => ({id, label: getLabel()})),
        },
    };

    const secretFields: Array<IFormField<IAIProvider>> = isExistingProvider
        ? [
            {
                field: 'api_key_alert',
                type: GenericFormFieldType.alert,
                component_parameters: {
                    style: 'info',
                },
                value: gettext(
                    'The stored API key is never shown here. Leave the field empty to keep it, '
                    + 'or enter a new key to replace it.',
                ),
            },
            {
                label: gettext('API key'),
                type: GenericFormFieldType.plainText,
                field: 'api_key',
                // Starts empty because the server never returns the key. Clearing it after typing
                // sends an empty string, which the server also reads as "keep the key".
                required: false,
                component_parameters: {password: true},
            },
        ]
        : [
            {
                label: gettext('API key'),
                type: GenericFormFieldType.plainText,
                field: 'api_key',
                required: true,
                component_parameters: {password: true},
            },
        ];

    /*
        Listing the models needs the stored key, so the pickers are only offered once the provider
        is saved. When the provider cannot be reached they degrade instead of blocking: the default
        model becomes a text input holding the stored model, and the available models are shown
        read only and saved back untouched.
    */
    const getModelOptions = (formValues: {readonly [key: string]: any}) => getProviderModels(formValues._id);

    const availableModelsParameters: ISelectAsyncParameters = {
        getOptions: getModelOptions,
        info: gettext('Leave empty to allow AI actions every model the provider lists.'),
    };

    // `available_models` restricts the actions, not this field, so the whole catalogue is on offer.
    const defaultModelParameters: ISelectAsyncParameters = {
        getOptions: getModelOptions,
        info: gettext('Used by an AI action that names no model of its own.'),
    };

    const availableModelsField: IFormField<IAIProvider> = {
        label: gettext('Available models'),
        type: GenericFormFieldType.selectMultipleAsync,
        field: 'available_models',
        component_parameters: availableModelsParameters,
    };

    const defaultModelField: IFormField<IAIProvider> = isExistingProvider
        ? {
            label: gettext('Default model'),
            type: GenericFormFieldType.selectAsync,
            field: 'default_model',
            component_parameters: defaultModelParameters,
        }
        : {
            label: gettext('Default model'),
            type: GenericFormFieldType.plainText,
            field: 'default_model',
        };

    return {
        direction: 'vertical',
        type: 'inline',
        form: [
            {
                label: gettext('Active'),
                type: GenericFormFieldType.checkbox,
                field: 'active',
                defaultValue: true,
            },
            getNameField(),
            providerTypeField,
            {
                label: gettext('Base URL'),
                type: GenericFormFieldType.plainText,
                field: 'base_url',
                required: true,
                component_parameters: {
                    // Pasting a full completions endpoint is the common mistake, and it surfaces
                    // as a 404 from a doubled path rather than a validation error.
                    info: gettext('The API base URL only, for example https://openrouter.ai/api/v1.'),
                },
            },
            ...secretFields,
            ...(isExistingProvider ? [availableModelsField] : []),
            defaultModelField,
        ],
    };
}
