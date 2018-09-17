const lastMonthFilter = {
    key: 'last_month',
    label: gettext('Last Month'),
    elasticSearchDateRange: {
        lte: 'now-1M/M',
        gte: 'now-1M/M',
    },
};

const lastWeekFilter = {
    key: 'last_week',
    label: gettext('Last Week'),
    elasticSearchDateRange: {
        lte: 'now-1w/w',
        gte: 'now-1w/w',
    },
};

const lastDayFilter = {
    key: 'last_day',
    label: gettext('Last Day'),
    elasticSearchDateRange: {
        lte: 'now-1d/d',
        gte: 'now-1d/d',
    },
};

const last24hoursFilter = {
    key: 'last_24_hours',
    label: gettext('Last 24 Hours'),
    elasticSearchDateRange: {
        gte: 'now-24H',
    },
};

const last8hoursFilter = {
    key: 'last_8_hours',
    label: gettext('Last 8 Hours'),
    elasticSearchDateRange: {
        gte: 'now-8H',
    },
};

export const dateRangesByKey = {
    last_month: lastMonthFilter,
    last_week: lastWeekFilter,
    last_day: lastDayFilter,
    last_24_hours: last24hoursFilter,
    last_8_hours: last8hoursFilter,
};

export const getDateFilters = (gettext) => [
    {
        labelBlock: gettext('Date created'),
        labelFrom: gettext('Created from'),
        labelTo: gettext('Created to'),
        fieldname: 'firstcreated',
        predefinedFilters: [lastDayFilter, lastWeekFilter, lastMonthFilter],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date modified'),
        labelFrom: gettext('Modified from'),
        labelTo: gettext('Modified to'),
        fieldname: 'versioncreated',
        predefinedFilters: [lastDayFilter, lastWeekFilter, lastMonthFilter],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date published'),
        labelFrom: gettext('Published from'),
        labelTo: gettext('Published to'),
        fieldname: 'firstpublished',
        predefinedFilters: [lastDayFilter, lastWeekFilter, lastMonthFilter],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date scheduled'),
        labelFrom: null,
        labelTo: null,
        fieldname: 'schedule_settings.utc_publish_schedule',
        predefinedFilters: [last24hoursFilter, last8hoursFilter],
        isEnabled: (searchConfig) => searchConfig.scheduled,
    },
];

const elasticSearchDateRangeToFieldNames = (elasticSearchDateRange, baseFieldName) => {
    let result = {};

    if (elasticSearchDateRange.gte != null) {
        result[baseFieldName + 'from'] = elasticSearchDateRange.gte;
    }
    if (elasticSearchDateRange.lte != null) {
        result[baseFieldName + 'to'] = elasticSearchDateRange.lte;
    }

    return result;
};

export function mapPredefinedDateFiltersClientToServer(search) {
    let nextSearch = {...search};

    // map custom range keys to from/to values server can understand

    getDateFilters(gettext).forEach((dateFilter) => {
        const searchValueForFilter = search[dateFilter.fieldname];
        const predefinedFilter = dateFilter.predefinedFilters.find(
            (predefinedFilter) => predefinedFilter.key === searchValueForFilter
        );

        if (predefinedFilter != null) {
            nextSearch = {
                ...search,
                ...elasticSearchDateRangeToFieldNames(
                    predefinedFilter.elasticSearchDateRange,
                    dateFilter.fieldname
                ),
            };

            delete nextSearch[dateFilter.fieldname];
        }
    });

    return nextSearch;
}

export function mapPredefinedDateFiltersServerToClient(search) {
    let nextSearch = {...search};

    getDateFilters(gettext).forEach((dateFilter) => {
        dateFilter.predefinedFilters.forEach((predefinedFilter) => {
            const expectedSearch = elasticSearchDateRangeToFieldNames(
                predefinedFilter.elasticSearchDateRange,
                dateFilter.fieldname
            );

            if (Object.keys(expectedSearch).every((key) => expectedSearch[key] === nextSearch[key])) {
                Object.keys(expectedSearch).forEach((key) => {
                    delete nextSearch[key];
                });

                nextSearch[dateFilter.fieldname] = predefinedFilter.key;
            }
        });
    });

    return nextSearch;
}