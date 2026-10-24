import {IArticle, ISuperdesk} from 'superdesk-api';
import {superdesk} from './superdesk';

export interface IConfigurationOptions {
    generateHeadlines?: (article: IArticle, abortSignal: AbortSignal) => Promise<Array<string>>;
    generateSummary?: (article: IArticle, abortSignal: AbortSignal) => Promise<string>;
    translations?: {
        generateTranslations: (article: IArticle, language: string, abortSignal: AbortSignal) => Promise<string>;
        translateActionIntegration?: boolean;
    };

    /**
     * Called after a generated answer was written into the article, so that a host which logs its
     * runs can record what was done with them. `index` is the position of the answer in the list
     * the generate callback resolved with.
     */
    onAnswerApplied?: (article: IArticle, feature: 'headlines' | 'summary', index: number) => void;
}

export const configuration: IConfigurationOptions = {};

export function configure(fn: (superdesk: ISuperdesk) => IConfigurationOptions) {
    const _configuration = fn(superdesk);

    Object.assign(configuration, _configuration);
}

