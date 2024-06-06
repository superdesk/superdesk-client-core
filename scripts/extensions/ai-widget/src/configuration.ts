import {IArticle, ISuperdesk} from 'superdesk-api';

export interface IConfigurationOptions {
    generateHeadlines?: (article: IArticle, superdesk: ISuperdesk) => Promise<Array<string>>;
    generateSummary?: (article: IArticle, superdesk: ISuperdesk) => Promise<string>;
    translations?: {
        generateTranslations: (article: IArticle, language: string, superdesk: ISuperdesk) => Promise<string>;
        translateActionIntegration?: boolean;
    };
}

export const configuration: IConfigurationOptions = {};

export function configure(_configuration: IConfigurationOptions) {
    Object.assign(configuration, _configuration);
}

