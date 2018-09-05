import {ISavedSearch, updateSubscribers, unsubscribe} from "business-logic/SavedSearch";
import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {createCronInterval, CronTimeInterval} from "types/DataStructures/TimeInterval";
import {IUser} from "business-logic/User";

interface ITimeIntervalUi {
    everyDay: 'true' | 'false'; // sd-check won't set a boolean
    customWeekdays: Array<string>;
    everyHour: 'true' | 'false'; // sd-check won't set a boolean
    customHours: Array<string>;
}

interface IModel extends ITimeIntervalUi {
    hoursList: Array<string>;
}

interface IScope extends IDirectiveScope<IModel> {
    savedSearch: ISavedSearch;
    closeModal(): void;
    savingEnabled(): void;
    saveOrUpdate(): void;
    unsubscribe(): void;
    isAlreadySubscribed(): boolean;
    cancelEditingSubscription(event?: Event): void;
}

const hourNameLookUp = {
    0: '00:00',
    1: '01:00',
    2: '02:00',
    3: '03:00',
    4: '04:00',
    5: '05:00',
    6: '06:00',
    7: '07:00',
    8: '08:00',
    9: '09:00',
    10: '10:00',
    11: '11:00',
    12: '12:00',
    13: '13:00',
    14: '14:00',
    15: '15:00',
    16: '16:00',
    17: '17:00',
    18: '18:00',
    19: '19:00',
    20: '20:00',
    21: '21:00',
    22: '22:00',
    23: '23:00',
};

const weekdaysToNumbersLookup = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
};

const numbersToWeekdaysLookup = {
    0: 'SUN',
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
};

const cronExpressionToTimeIntervalUi = (cron: CronTimeInterval): ITimeIntervalUi => {
    const cronArray = cron.split(' ');
    const hours = cronArray[1];
    const weekdays = cronArray[4];

    const everyHour = hours === '*';
    const everyDay = weekdays === '*';

    return {
        everyDay: everyDay ? 'true' : 'false',
        customWeekdays: everyDay ? [] : weekdays.split(',')
            .map((dayNumber: string) => numbersToWeekdaysLookup[dayNumber]),
        everyHour: everyHour ? 'true' : 'false',
        customHours: everyHour ? [] : hours.split(',').map((hourNumber: string) => hourNameLookUp[hourNumber]),
    };
};

SavedSearchSubscribe.$inject = ['asset', 'session', 'api'];

export function SavedSearchSubscribe(asset, session, api) {
    return {
        scope: {
            savedSearch: '=',
            cancelEditingSubscription: '=',
        },
        templateUrl: asset.templateUrl('apps/search/views/saved-search-subscribe.html'),
        link: function(scope: IScope) {

            const getDefaults = (): IModel => ({
                everyDay: 'true',
                customWeekdays: [],
                everyHour: 'true',
                customHours: [],
                hoursList: [
                    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00',
                    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
                ],
            });

            scope.closeModal = () => {
                scope.cancelEditingSubscription();
                scope.wrapper = getDefaults();
            };

            scope.isAlreadySubscribed = () => scope.savedSearch.subscribers.user_subscriptions.some(
                (subscription) => subscription.user === session.identity._id,
            );

            scope.savingEnabled = () => (scope.wrapper.everyDay === 'true' || scope.wrapper.customWeekdays.length > 0)
                && (scope.wrapper.everyHour === 'true' || scope.wrapper.customHours.length > 0);

            scope.saveOrUpdate = () => {
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

                const userId: IUser['_id'] = session.identity._id;

                const nextUserSubscriptions = scope.isAlreadySubscribed()
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

                const nextSubscribers: ISavedSearch['subscribers'] = {
                    ...scope.savedSearch.subscribers,
                    user_subscriptions: nextUserSubscriptions,
                };

                updateSubscribers(scope.savedSearch, nextSubscribers, api)
                    .then(scope.closeModal);
            };

            scope.unsubscribe = () => unsubscribe(scope.savedSearch, session.identity._id, api).then(scope.closeModal);

            scope.$watch('savedSearch', () => {
                if (scope.savedSearch != null && scope.savedSearch.subscribers == null) {
                    scope.savedSearch.subscribers = {
                        user_subscriptions: [],
                        desk_subscriptions: [],
                    };
                }

                if (scope.savedSearch != null) {
                    const userSubscription = scope.savedSearch.subscribers.user_subscriptions.find(
                        (subscription) => subscription.user === session.identity._id,
                    );

                    scope.wrapper = userSubscription == null
                        ? getDefaults()
                        : {
                            ...getDefaults(),
                            ...cronExpressionToTimeIntervalUi(userSubscription.scheduling),
                        };
                } else {
                    scope.wrapper = getDefaults();
                }
            });
        },
    };
}
