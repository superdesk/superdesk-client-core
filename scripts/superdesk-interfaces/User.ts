import {IDesk} from './Desk';
import {IUserRole} from './UserRole';

export interface IUser {
    _id: string;
    username: string;
    password: string;
    password_changed_on: string;
    first_name?: string; // not mandatory, empty when user is created programatically
    last_name?: string; // not mandatory, empty when user is created programatically
    display_name: string;
    email: string;
    phone: string;
    job_title: string;
    biography: string;
    facebook: string;
    instagram: string;
    twitter: string;
    jid: string;
    language: string;
    user_info: {};
    picture_url: string;
    avatar: string;
    avatar_renditions: {};
    role?: IUserRole['_id'];
    privileges: {};
    user_type: 'user' | 'administrator';
    is_support: boolean;
    is_author: boolean;
    is_active: boolean;
    is_enabled: boolean;
    needs_activation: boolean;
    desk: IDesk;
    SIGN_OFF: string;
    BYLINE: string;
    invisible_stages: Array<any>;
    slack_username: string;
    slack_user_id: string;
}
