import {IBaseRestApiResponse} from 'superdesk-api';

export type IAIProviderType = 'openai_compatible';

export interface IAIProvider extends IBaseRestApiResponse {
    name: string;
    provider_type: IAIProviderType;
    base_url: string;

    /**
     * Write-only. The server never returns it, so it is only ever set from the create form
     * or from an edit where the operator re-typed it.
     */
    api_key?: string;

    default_model?: string;
    active: boolean;
    config?: {[key: string]: any};
}

export interface IAIProviderTestResult {
    ok: boolean;
    models_count?: number;
    error?: string;
}
