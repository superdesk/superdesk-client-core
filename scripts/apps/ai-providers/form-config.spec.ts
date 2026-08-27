import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {getFormFieldsRecursive} from 'core/ui/components/generic-form/form-field';
import ng from 'core/services/ng';
import type {IFormField, IFormFieldAlert} from 'superdesk-api';
import {toModelOptions} from './api';
import {AI_PROVIDER_TYPES, getAiProviderFormConfig} from './form-config';
import type {IAIProvider} from './interfaces';

function getFields(item?: Partial<IAIProvider>): Array<IFormField<IAIProvider>> {
    return getFormFieldsRecursive(getAiProviderFormConfig(item).form);
}

function getFieldNames(item?: Partial<IAIProvider>): Array<string> {
    return getFields(item).map(({field}) => field);
}

describe('ai providers form config', () => {
    it('requires the api key when creating a provider', () => {
        expect(getFieldNames().includes('api_key')).toBe(true);
        expect(getFields().find(({field}) => field === 'api_key').required).toBe(true);
    });

    it('offers an optional api key when editing a saved provider so the key can be rotated', () => {
        const apiKeyField = getFields({_id: 'provider-1', name: 'existing'})
            .find(({field}) => field === 'api_key');

        expect(apiKeyField).toBeDefined();
        expect(apiKeyField.required).toBe(false);
    });

    it('masks the api key input on both the create and the edit form', () => {
        expect(getFields().find(({field}) => field === 'api_key').component_parameters.password).toBe(true);
        expect(
            getFields({_id: 'provider-1'})
                .find(({field}) => field === 'api_key')
                .component_parameters.password,
        ).toBe(true);
    });

    it('explains the stored key with an alert when editing a saved provider', () => {
        const alertFields = getFields({_id: 'provider-1'})
            .filter(({type}) => type === GenericFormFieldType.alert);

        expect(alertFields.length).toBe(1);
        expect((alertFields[0] as IFormFieldAlert<IAIProvider>).value.length).toBeGreaterThan(0);
        expect(getFields().filter(({type}) => type === GenericFormFieldType.alert).length).toBe(0);
    });

    it('spells out the expected base url format on the create and the edit form', () => {
        [getFields(), getFields({_id: 'provider-1'})].forEach((fields) => {
            const info = fields.find(({field}) => field === 'base_url').component_parameters?.info;

            expect(info).toContain('https://openrouter.ai/api/v1');
            expect(info).toContain('/chat/completions');
        });
    });

    it('feeds the provider type select from the provider type list', () => {
        const providerTypeField = getFields().find(({field}) => field === 'provider_type');

        expect(providerTypeField.type).toBe(GenericFormFieldType.select);
        expect(providerTypeField.component_parameters.options).toEqual(
            AI_PROVIDER_TYPES.map(({id, getLabel}) => ({id, label: getLabel()})),
        );
        expect(providerTypeField.component_parameters.options).toEqual([
            {id: 'openai_compatible', label: 'OpenAI compatible'},
        ]);
    });

    it('types the default model by hand when creating a provider', () => {
        const defaultModelField = getFields().find(({field}) => field === 'default_model');

        expect(defaultModelField.type).toBe(GenericFormFieldType.plainText);
    });

    it('picks the default model from the provider models when editing a saved provider', () => {
        const defaultModelField = getFields({_id: 'provider-1'})
            .find(({field}) => field === 'default_model');

        expect(defaultModelField.type).toBe(GenericFormFieldType.selectAsync);
        expect(typeof defaultModelField.component_parameters.getOptions).toBe('function');
    });

    it('lists the models of the provider identified by `_id`', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve({
            ok: true,
            json: () => Promise.resolve({models: []}),
        } as unknown as Response));

        spyOn(ng, 'getService').and.returnValue(Promise.resolve({token: 'token'}));

        const item: Partial<IAIProvider> = {_id: 'abc123', name: 'nope'};
        const defaultModelField = getFields(item).find(({field}) => field === 'default_model');

        await defaultModelField.component_parameters.getOptions(item);

        expect(fetchSpy.calls.mostRecent().args[0])
            .toBe('http://localhost:5000/ai_providers/abc123/models');
    });

    it('turns the model ids the server returns into picker options', () => {
        expect(toModelOptions(['gpt-4o', 'gpt-4o-mini'])).toEqual([
            {id: 'gpt-4o', label: 'gpt-4o'},
            {id: 'gpt-4o-mini', label: 'gpt-4o-mini'},
        ]);
    });

    it('defaults a new provider to active', () => {
        const activeField = getFields().find(({field}) => field === 'active');

        expect(activeField.type).toBe(GenericFormFieldType.checkbox);
        expect(activeField.defaultValue).toBe(true);
    });
});
