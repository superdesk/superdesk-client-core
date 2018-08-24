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
        desks: Dictionary<Desk['_id'], SavedSearchPreferences>;
    };
}

export const isUserSubsribedToSavedSearch = (_savedSearch: SavedSearch, userId: User['id']) => {
    const {subscribers} = _savedSearch;

    if (subscribers.users[userId] != null) {
        return true;
    }

    for (const deskId in subscribers.desks) {
        const desk: Desk = subscribers.desks[deskId];

        if (desk.members.includes(userId)) {
            return true;
        }
    }

    return false;
};
