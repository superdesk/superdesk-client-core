import {IUser} from './User';
import {IDesk} from './Desk';
import {CronTimeInterval} from 'types/DataStructures/TimeInterval';

interface IUserSubscription {
    user: IUser['_id'];
    scheduling: CronTimeInterval;
}

interface IDeskSubscription {
    desk: IDesk['_id'];
    scheduling: CronTimeInterval;
}

export interface ISavedSearch {
    name: string;
    description: string;
    is_global: boolean;
    filter: any;
    user: IUser['_id'];
    subscribers: {
        user_subscriptions: Array<IUserSubscription>;
        desk_subscriptions: Array<IDeskSubscription>;
    };
}

export const isUserSubscribedToSavedSearch = (
    _savedSearch: ISavedSearch,
    userId: IUser['_id'],
    getDesk: (id: IDesk['_id']) => IDesk,
): boolean => {
    const {subscribers} = _savedSearch;

    if (subscribers == null) {
        return false;
    }

    if (subscribers.user_subscriptions.some((subscription) => subscription.user === userId)) {
        return true;
    }

    if (subscribers.desk_subscriptions.some((subscription) => {
        const desk: IDesk = getDesk(subscription.desk);

        if (desk.members.includes(userId)) {
            return true;
        }
    })) {
        return true;
    } else {
        return false;
    }
};

export const updateSubscribers = (
    savedSearch: ISavedSearch,
    nextSubscribers: ISavedSearch['subscribers'],
    api: any,
): Promise<void> => {
    const savedSearchNext: ISavedSearch = {
        ...savedSearch,
        subscribers: nextSubscribers,
    };

    return api('saved_searches')
        .save(savedSearch, savedSearchNext);
};

export const unsubscribe = (
    savedSearch: ISavedSearch,
    userId: IUser['_id'],
    api: any,
): Promise<void> => {
    const nextSubscribers: ISavedSearch['subscribers'] = {
        ...savedSearch.subscribers,
        user_subscriptions: savedSearch.subscribers.user_subscriptions.filter(
            (subscription) => subscription.user !== userId,
        ),
    };

    return updateSubscribers(savedSearch, nextSubscribers, api);
};
