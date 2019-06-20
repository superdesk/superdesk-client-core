import {IAuthor} from './Author';
import {IBaseRestApiResponse, IDesk, IStage, IUser} from 'superdesk-api';

export interface IArticle extends IBaseRestApiResponse {
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

    highlights?: Array<string>;

    task: {
        desk: IDesk['_id'];
        stage: IStage['_id'];
        user: IUser['_id'];
    };

    // might be only used for client-side state
    created: any;
    archived: any;

    // remove when SDESK-4343 is done.
    selected: any;

    // planning extension
    assignment_id?: string;

    // markForUser extension
    marked_for_user?: string;
}
