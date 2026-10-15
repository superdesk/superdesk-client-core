import {IBaseRestApiResponse} from 'superdesk-api';

export type IAIProviderType = 'openai_compatible';

export interface IAIProvider extends IBaseRestApiResponse {
    name: string;
    provider_type: IAIProviderType;
    base_url: string;

    /** Write-only. The server never returns it, so it is only ever set from a form. */
    api_key?: string;

    /** Models the provider may be used with. Empty means no restriction. */
    available_models?: Array<string>;

    default_model?: string;
    active: boolean;
    config?: {[key: string]: any};
}

export interface IAIProviderTestResult {
    ok: boolean;
    models_count?: number;
    error?: string;
}
