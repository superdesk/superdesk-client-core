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
