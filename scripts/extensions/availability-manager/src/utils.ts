export function getLocalizedDateString(localeCode: string, date: Date) {
    return new Intl.DateTimeFormat(localeCode, {
        year: 'numeric',
        month: 'long',
        weekday: 'long',
        day: 'numeric',
    }).format(date);
}