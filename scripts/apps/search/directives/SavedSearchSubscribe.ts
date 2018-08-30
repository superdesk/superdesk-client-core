import {ISavedSearch} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {createCronInterval} from "types/DataStructures/TimeInterval";
import {IUser} from "business-logic/User";

interface IModel {
    everyDay: 'true' | 'false'; // sd-check won't set a boolean
    customWeekdays: Array<string>;
    everyHour: 'true' | 'false'; // sd-check won't set a boolean
    customHours: Array<string>;
    hoursList: Array<string>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    closeModal(): void;
    savingEnabled(): void;
    saveOrUpdate(): void;
}

const weekdaysToNumbersLookup = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
};

SavedSearchSubscribe.$inject = ['asset', 'session', 'api'];

export function SavedSearchSubscribe(asset, session, api) {
    return {
        scope: {
            savedSearch: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-subscribe.html'),
        link: function(scope: IScope) {

            scope.closeModal = () => {
                scope.savedSearch = null;
                scope.wrapper = scope.getDefaults();
            };

            scope.getDefaults = () => ({
                everyDay: 'true',
                customWeekdays: [],
                everyHour: 'true',
                customHours: [],
                hoursList: [
                    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00',
                    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
                ],
                validationErrors: [],
            });

            scope.savingEnabled = () => (scope.wrapper.everyDay === 'true' || scope.wrapper.customWeekdays.length > 0)
                && (scope.wrapper.everyHour === 'true' || scope.wrapper.customHours.length > 0);

            scope.saveOrUpdate = () => {
                if (scope.savedSearch.subscribers == null) {
                    scope.savedSearch.subscribers = {
                        user_subscriptions: [],
                        desk_subscriptions: [],
                    };
                }

                const weekdays = scope.wrapper.everyDay === 'true'
                    ? '*'
                    : scope.wrapper.customWeekdays
                        .map((weekdayShort) => weekdaysToNumbersLookup[weekdayShort])
                        .sort((a: number, b: number) => a - b)
                        .join(',');

                const hours = scope.wrapper.everyHour === 'true'
                    ? '*'
                    : scope.wrapper.customHours
                        .map((hourMinuteString) => parseInt(hourMinuteString.slice(0, 2), 10))
                        .sort((a: number, b: number) => a - b)
                        .join(',');

                const cronExpression = createCronInterval('*', hours, '*', '*', weekdays);

                const userId: IUser['id'] = session.identity._id;

                const userSubscriptionAlreadyExists = scope.savedSearch.subscribers.user_subscriptions.some(
                        (subscription) => subscription.user === userId,
                    );

                const nextUserSubscriptions = userSubscriptionAlreadyExists
                    ? scope.savedSearch.subscribers.user_subscriptions.map((subscription) => {
                        if (subscription.user === userId) {
                            return {
                                ...subscription,
                                scheduling: cronExpression,
                            };
                        } else {
                            return subscription;
                        }
                    })
                    : scope.savedSearch.subscribers.user_subscriptions.concat([{
                            user: userId,
                            scheduling: cronExpression,
                        }]);

                const savedSearchNext: ISavedSearch = {
                    ...scope.savedSearch,
                    subscribers: {
                        ...scope.savedSearch.subscribers,
                        user_subscriptions: nextUserSubscriptions,
                    },
                };

                api('saved_searches')
                    .save(scope.savedSearch, savedSearchNext)
                    .then(scope.closeModal, () => '');
            };

            scope.wrapper = scope.getDefaults();
        },
    };
}
