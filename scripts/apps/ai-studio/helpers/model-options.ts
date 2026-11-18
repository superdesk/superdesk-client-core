import {gettext} from 'core/utils';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {ISelectOption} from '../interfaces';

/** Value of the option that stores no model, so a run uses the provider's `default_model` */
export const PROVIDER_DEFAULT_MODEL = '';

/** Active providers, plus the selected one when it is inactive or no longer exists */
export function getProviderOptions(
    providers: Array<IAIProvider>,
    selectedProviderId: string | null,
): Array<ISelectOption> {
    const options = providers
        .filter(({active}) => active)
        .map(({_id, name}) => ({id: _id, label: name}));

    if (selectedProviderId != null && !options.some(({id}) => id === selectedProviderId)) {
        const selected = providers.find(({_id}) => _id === selectedProviderId);

        options.push({
            id: selectedProviderId,
            label: selected == null
                ? gettext('{{id}} (deleted)', {id: selectedProviderId})
                : gettext('{{name}} (inactive)', {name: selected.name}),
        });
    }

    return options;
}

/**
 * The provider default always comes first, even with a shortlist, since the default model does not
 * have to be on it. The selected model is kept when the shortlist no longer holds it.
 */
export function getModelOptions(provider: IAIProvider | null, selectedModel: string | null): Array<ISelectOption> {
    const defaultModel = provider?.default_model;
    const options: Array<ISelectOption> = [
        {
            id: PROVIDER_DEFAULT_MODEL,
            label: defaultModel
                ? gettext('Provider default ({{model}})', {model: defaultModel})
                : gettext('Provider default (none set)'),
        },
        ...(provider?.available_models ?? []).map((model) => ({id: model, label: model})),
    ];

    if (selectedModel != null && !options.some(({id}) => id === selectedModel)) {
        options.push({
            id: selectedModel,
            label: gettext('{{model}} (not in the provider\'s models)', {model: selectedModel}),
        });
    }

    return options;
}

/**
 * Why the action could not run with this provider and model, or `null` when it can. With no model
 * of its own an action runs on the provider's default, and an action with neither is left out of
 * what editors are offered.
 */
export function getModelWarning(provider: IAIProvider | null, selectedModel: string | null): string | null {
    if (provider == null || selectedModel != null || provider.default_model) {
        return null;
    }

    if ((provider.available_models ?? []).length > 0) {
        return gettext('The provider has no default model, so pick a model or the action can\'t run.');
    }

    return gettext(
        'The provider has no models listed and no default model, so the action can\'t run. '
        + 'Set them on the provider in Settings > AI Providers.',
    );
}
