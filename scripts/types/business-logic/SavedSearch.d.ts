import {User} from './User';
import {Desk} from './Desk';

interface SavedSearchPreferences {
    notificationInterval: TimeInterval;
}

export interface SavedSearch {
    name: string;
    description: string;
    is_global: boolean;
    filter: any;
    user: User['id'];
    subscribers: {
        users: Dictionary<User['id'], SavedSearchPreferences>;
        desks: Dictionary<Desk['id'], SavedSearchPreferences>;
    };
}
