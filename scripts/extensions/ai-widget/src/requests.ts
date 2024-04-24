import {IArticle, ISuperdesk} from 'superdesk-api';

export interface IRequests {
    generateHeadlines?: (article: IArticle, superdesk: ISuperdesk) => Promise<Array<string>>;
    generateSummary?: (article: IArticle, superdesk: ISuperdesk) => Promise<string>;
}

export const requests: IRequests = {};

export function setRequests(_requests: IRequests) {
    Object.assign(requests, _requests);
}
