import {IArticle, ISuperdesk} from 'superdesk-api';

export interface IConfigurationOptions {
    generateHeadlines?: (article: IArticle, superdesk: ISuperdesk) => Promise<Array<string>>;
    generateTranslations?: (article: IArticle, language: string, superdesk: ISuperdesk) => Promise<string>;
    generateSummary?: (article: IArticle, superdesk: ISuperdesk) => Promise<string>;
    overrideTranslations?: boolean;
}

export const configuration: IConfigurationOptions = {};

export function configure(_configuration: IConfigurationOptions) {
    Object.assign(configuration, _configuration);
}

