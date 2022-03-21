import {IDesk, IUser} from 'superdesk-api';

export interface IDeskSuggestion {
    type: 'desk';
    id: string; // not a real _id
    display: string;
}

export interface IUserSuggestion {
    type: 'user';
    id: string; // not a real _id
    display: string;
    user: IUser;
}

export interface IUserSuggestionData {
    users: {[_id: string]: IUser};
    mentionInputDataUsers: Array<IUserSuggestion>;
}

export type IComment = {
    _id: string;
    text: string;
    item: string;
    user?: IUser;
    mentioned_users?: {[key: string]: IUser['_id']};
    mentioned_desks?: {[key: string]: IDesk['_id']};
    _updated?: string;
    _created: string;
};
