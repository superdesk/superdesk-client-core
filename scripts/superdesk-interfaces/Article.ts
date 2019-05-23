import {IAuthor} from './Author';

export interface IArticle {
    _id: string;
    _current_version: number;
    guid: string;
    translated_from: string;
    translation_id: string;
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
    authors: Array<IAuthor>;
    headline: string;
    sms: string;
    abstract: string;
    byline: string;
    dateline: string;
    body_html: string;
    footer: string;
    firstcreated: any;
    versioncreated: any;
    body_footer: string;
    sign_off: string;
    feature_media: any;
    media_description: string;
    associations: { string: IArticle };
    type: 'text' | 'picture' | 'video' | 'audio' | 'preformatted' | 'graphic' | 'composite';
    firstpublished?: string;
    linked_in_packages: any;
    gone: any;
    lock_action: any;
    lock_user: any;
    lock_session: any;
    rewritten_by?: string;
    extra?: {[key: string]: any};

    // might be only used for client-side state
    created: any;
    archived: any;

    // TODO: remove this, it's only used for client-side state
    selected: any;
}
