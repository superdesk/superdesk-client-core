import {IUser} from './User';
import {IDesk} from './Desk';

interface ISavedSearchPreferences {
    notificationInterval: TimeInterval;
}

export interface ISavedSearch {
    name: string;
    description: string;
    is_global: boolean;
    filter: any;
    user: IUser['id'];
    subscribers: {
        users: Dictionary<IUser['id'], ISavedSearchPreferences>;
        desks: Dictionary<IDesk['_id'], ISavedSearchPreferences>;
    };
}

export const isUserSubsribedToSavedSearch = (_savedSearch: ISavedSearch, userId: IUser['id']) => {
    const {subscribers} = _savedSearch;

    if (subscribers.users[userId] != null) {
        return true;
    }

    for (const deskId in subscribers.desks) {
        const desk: IDesk = subscribers.desks[deskId];

        if (desk.members.includes(userId)) {
            return true;
        }
    }

    return false;
};
