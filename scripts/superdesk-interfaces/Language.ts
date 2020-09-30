import {IBaseRestApiResponse} from 'superdesk-api';

export interface ILanguage extends IBaseRestApiResponse {
    destination: boolean;
    label: string;
    language: string;
    source: boolean;
}
