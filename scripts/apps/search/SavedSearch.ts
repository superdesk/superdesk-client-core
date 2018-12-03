import {IUser} from 'superdesk-interfaces/User';
import {IDesk} from 'superdesk-interfaces/Desk';
import {CronTimeInterval} from 'types/DataStructures/TimeInterval';

import {forOwn} from 'lodash';
import {mapPredefinedDateFiltersClientToServer} from 'apps/search/directives/DateFilters';
import {setFilters} from './services/SearchService';

export interface IUserSubscription {
    user: IUser['_id'];
    scheduling: CronTimeInterval;
    next_report?: any;
}

export interface IDeskSubscription {
    desk: IDesk['_id'];
    scheduling: CronTimeInterval;
    next_report?: any;
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

// TODO: implement diffing
// server doesn't allow read-only fields in patch request
const removeReadOnlyUserSubscriberFields = (subscription: IUserSubscription): IUserSubscription => ({
    user: subscription.user,
    scheduling: subscription.scheduling,
});

// TODO: implement diffing
// server doesn't allow read-only fields in patch request
const removeReadOnlyDeskSubscriberFields = (subscription: IDeskSubscription): IDeskSubscription => ({
    desk: subscription.desk,
    scheduling: subscription.scheduling,
});

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

export const updateSubscribers = (
    savedSearch: ISavedSearch,
    nextSubscribers: ISavedSearch['subscribers'],
    api: any,
): Promise<void> => {
    const savedSearchNext: ISavedSearch = {
        ...savedSearch,
        subscribers: nextSubscribers,
    };

    return saveOrUpdateSavedSearch(api, savedSearch, savedSearchNext);
};

export const unsubscribeUser = (
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

export const unsubscribeDesk = (
    savedSearch: ISavedSearch,
    deskId: IDesk['_id'],
    api: any,
): Promise<void> => {
    const nextSubscribers: ISavedSearch['subscribers'] = {
        ...savedSearch.subscribers,
        desk_subscriptions: savedSearch.subscribers.desk_subscriptions.filter(
            (subscription) => subscription.desk !== deskId,
        ),
    };

    return updateSubscribers(savedSearch, nextSubscribers, api);
};

export function mapFiltersServerToClient(savedSearch: ISavedSearch) {
    savedSearch.filter.query = setFilters(savedSearch.filter.query);

    return savedSearch;
}

function mapFiltersClientToServer(search) {
    let nextSearch = {...search};

    forOwn(nextSearch, (value, key) => {
        if (['priority', 'urgency'].includes(key)) {
            // Convert integer fields: priority and urgency to objects
            nextSearch[key] = JSON.parse(value);
        }
    });

    nextSearch = mapPredefinedDateFiltersClientToServer(nextSearch);

    return nextSearch;
}

export function saveOrUpdateSavedSearch(api, savedSearchOriginal: ISavedSearch, savedSearchChanged: ISavedSearch) {
    if (savedSearchChanged.filter != null && savedSearchChanged.filter.query != null) {
        savedSearchChanged.filter.query = mapFiltersClientToServer(savedSearchChanged.filter.query);
    }

    if (savedSearchChanged.subscribers != null) {
        if (savedSearchChanged.subscribers.user_subscriptions != null) {
            savedSearchChanged.subscribers.user_subscriptions = savedSearchChanged.subscribers.user_subscriptions
                .map(removeReadOnlyUserSubscriberFields);
        }

        if (savedSearchChanged.subscribers.desk_subscriptions != null) {
            savedSearchChanged.subscribers.desk_subscriptions = savedSearchChanged.subscribers.desk_subscriptions
                .map(removeReadOnlyDeskSubscriberFields);
        }
    }

    return api('saved_searches').save(savedSearchOriginal, savedSearchChanged).then(mapFiltersServerToClient);
}
