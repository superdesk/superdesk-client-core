// use CRON expression https://en.wikipedia.org/wiki/Cron#CRON_expression
// <minute> <hour> <day-of-month> <month> <day-of-week>
// Example: Every Monday at 9am: "0 9 * * 1"
export type CronTimeInterval = string;

export const createCronInterval = (
    minute: string,
    hour: string,
    dayOfMonth: string,
    month: string,
    dayOfWeek: string,
): CronTimeInterval => `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
