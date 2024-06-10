import {IArticle, ISuperdesk} from 'superdesk-api';
import {superdesk} from './superdesk';

export interface IConfigurationOptions {
    generateHeadlines?: (article: IArticle, abortSignal: AbortSignal) => Promise<Array<string>>;
    generateSummary?: (article: IArticle, abortSignal: AbortSignal) => Promise<string>;
    translations?: {
        generateTranslations: (article: IArticle, language: string, abortSignal: AbortSignal) => Promise<string>;
        translateActionIntegration?: boolean;
    };
}

export const configuration: IConfigurationOptions = {};

export function configure(fn: (superdesk: ISuperdesk) => IConfigurationOptions) {
    const _configuration = fn(superdesk);

    Object.assign(configuration, _configuration);
}

