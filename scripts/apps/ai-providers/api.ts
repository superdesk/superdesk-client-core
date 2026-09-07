import {httpRequestJsonLocal} from 'core/helpers/network';
import type {ISelectAsyncOption} from 'core/ui/components/generic-form/input-types/select_async';
import type {IAIProvider} from './interfaces';

interface IAIProviderModels {
    models: Array<string>;
}

/** Models are identified by id alone, the provider offers no display name. */
export function toModelOptions(models: IAIProviderModels['models']): Array<ISelectAsyncOption> {
    return (models ?? []).map((model) => ({id: model, label: model}));
}

/** Rejects when the provider cannot be reached, which the model picker handles. */
export function getProviderModels(providerId: IAIProvider['_id']): Promise<Array<ISelectAsyncOption>> {
    return httpRequestJsonLocal<IAIProviderModels>({
        method: 'GET',
        path: `/ai_providers/${providerId}/models`,
    }).then(({models}) => toModelOptions(models));
}
