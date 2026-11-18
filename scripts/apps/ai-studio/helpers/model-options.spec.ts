import type {IAIProvider} from 'apps/ai-providers/interfaces';
import {PROVIDER_DEFAULT_MODEL, getModelOptions, getModelWarning, getProviderOptions} from './model-options';

function getProvider(overrides: Partial<IAIProvider> = {}): IAIProvider {
    return {
        _id: 'provider-1',
        name: 'OpenRouter',
        provider_type: 'openai_compatible',
        base_url: 'https://openrouter.ai/api/v1',
        active: true,
        available_models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku'],
        default_model: 'openai/gpt-4o-mini',
        ...overrides,
    } as IAIProvider;
}

describe('ai studio: model options', () => {
    it('offers the provider default first, storing no model, then the shortlist', () => {
        const options = getModelOptions(getProvider({default_model: 'openai/o3'}), null);

        expect(options[0].id).toBe(PROVIDER_DEFAULT_MODEL);
        expect(options[0].label).toContain('openai/o3');
        expect(options.slice(1).map(({id}) => id)).toEqual(['openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku']);
    });

    it('keeps a selected model the shortlist no longer holds', () => {
        const options = getModelOptions(getProvider(), 'openai/gpt-3.5');

        expect(options.map(({id}) => id)).toContain('openai/gpt-3.5');
    });

    it('offers only the provider default when the provider has no shortlist', () => {
        expect(getModelOptions(getProvider({available_models: []}), null).map(({id}) => id))
            .toEqual([PROVIDER_DEFAULT_MODEL]);
    });

    it('warns when no model is picked and the provider has no default', () => {
        expect(getModelWarning(getProvider(), null)).toBeNull();
        expect(getModelWarning(getProvider({default_model: undefined}), 'openai/gpt-4o-mini')).toBeNull();
        expect(getModelWarning(getProvider({default_model: undefined}), null)).not.toBeNull();
        expect(getModelWarning(getProvider({default_model: undefined, available_models: []}), null)).not.toBeNull();
        expect(getModelWarning(null, null)).toBeNull();
    });

    it('offers active providers, plus the selected one when it is inactive', () => {
        const providers = [
            getProvider(),
            getProvider({_id: 'provider-2', name: 'Old gateway', active: false}),
        ];

        expect(getProviderOptions(providers, null).map(({id}) => id)).toEqual(['provider-1']);
        expect(getProviderOptions(providers, 'provider-2').map(({id}) => id)).toEqual(['provider-1', 'provider-2']);
    });
});
