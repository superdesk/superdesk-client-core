import {IUser} from './User';

export interface IArticle {
    usageterms: any;
    keywords: any;
    language: any;
    slugline: any;
    genre: any;
    anpa_take_key: any;
    place: any;
    priority: any;
    urgency: any;
    anpa_category: any;
    subject: any;
    company_codes: Array<any>;
    ednote: string;
    authors: Array<IUser>;
    headline: string;
    sms: string;
    abstract: string;
    byline: string;
    dateline: string;
    body_html: string;
    footer: string;
    body_footer: string;
    sign_off: string;
    feature_media: any;
    media_description: string;
}
