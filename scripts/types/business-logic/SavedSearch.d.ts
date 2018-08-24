import {UserId} from './User';

export interface SavedSearch {
    name: string;
    description: string;
    is_global: boolean;
    filter: any;
    user: UserId;
}
