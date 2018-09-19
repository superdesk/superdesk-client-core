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

        return desk.members.includes(userId);
    })) {
        return true;
    } else {
        return false;
    }
};
