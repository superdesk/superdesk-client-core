import {IDirectiveScope} from "types/Angular/DirectiveScope";
import {CronTimeInterval, createCronInterval} from "types/DataStructures/TimeInterval";

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
    initialValue: CronTimeInterval;
    onChange(cronExpression: CronTimeInterval): void;
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

const timeIntervalUiToCronExpression = (timeInterval: ITimeIntervalUi): CronTimeInterval => {
    const weekdays = timeInterval.everyDay === 'true' || timeInterval.customWeekdays.length < 1
        ? '*'
        : timeInterval.customWeekdays
            .map((weekdayShort) => weekdaysToNumbersLookup[weekdayShort])
            .sort((a: number, b: number) => a - b)
            .join(',');

    const hours = timeInterval.everyHour === 'true' || timeInterval.customHours.length < 1
        ? '*'
        : timeInterval.customHours
            .map((hourMinuteString) => parseInt(hourMinuteString.slice(0, 2), 10))
            .sort((a: number, b: number) => a - b)
            .join(',');

    return createCronInterval('*', hours, '*', '*', weekdays);
};

export function EditTimeInterval() {
    return {
        scope: {
            initialValue: '=',
            onChange: '=',
        },
        template: require('../views/edit-time-interval.html'),
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

            scope.wrapper = getDefaults();

            scope.$watch('wrapper', () => {
                const cronExpression: CronTimeInterval = timeIntervalUiToCronExpression(scope.wrapper);

                scope.onChange(cronExpression);
            }, true);

            scope.$watch('initialValue', () => {
                if (scope.initialValue != null) {
                    scope.wrapper = {
                        ...scope.wrapper,
                        ...cronExpressionToTimeIntervalUi(
                            scope.initialValue || createCronInterval('*', '*', '*', '*', '*'),
                        ),
                    };
                }
            }, true);
        },
    };
}
