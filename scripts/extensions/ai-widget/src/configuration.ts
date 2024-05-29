import {IArticle, ISuperdesk, IOnTranslateActions} from 'superdesk-api';
import {superdesk} from './superdesk';

export interface IConfigurationOptions {
    generateHeadlines?: (article: IArticle, superdesk: ISuperdesk) => Promise<Array<string>>;
    generateSummary?: (article: IArticle, superdesk: ISuperdesk) => Promise<string>;
}

export const configuration: IConfigurationOptions = {};

export function configure(_configuration: IConfigurationOptions) {
    Object.assign(configuration, _configuration);
}

export function configureOnTranslate(_onTranslateActions: IOnTranslateActions) {
    Object.assign(superdesk.authoringGeneric.onTranslateActions, _onTranslateActions)
}
