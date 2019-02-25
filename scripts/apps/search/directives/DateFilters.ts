import {gettext} from 'core/utils';

interface IDateRange {
    key: string;
    label: string;
    elasticSearchDateRange: {
        lte?: string,
        gte?: string,
    };
}

const before1MonthFilter: IDateRange = {
    key: 'before_next_month',
    label: gettext('Next Month'),
    elasticSearchDateRange: {
        lte: 'now+1M/d',
    },
};

const before3MonthsFilter: IDateRange = {
    key: 'before_3_months_ahead',
    label: gettext('Next 3 Months'),
    elasticSearchDateRange: {
        lte: 'now+3M/d',
    },
};

const last30daysFilter: IDateRange = {
    key: 'last_30_days',
    label: gettext('Last 30 Days'),
    elasticSearchDateRange: {
        gte: 'now-30d',
    },
};

const last7daysFilter: IDateRange = {
    key: 'last_7_days',
    label: gettext('Last 7 Days'),
    elasticSearchDateRange: {
        gte: 'now-7d',
    },
};

const last24hoursFilter: IDateRange = {
    key: 'last_24_hours',
    label: gettext('Last 24 Hours'),
    elasticSearchDateRange: {
        gte: 'now-24H',
    },
};

const last8hoursFilter: IDateRange = {
    key: 'last_8_hours',
    label: gettext('Last 8 Hours'),
    elasticSearchDateRange: {
        gte: 'now-8H',
    },
};

export const dateRangesByKey: Dictionary<string, IDateRange> = {
    before_next_month: before1MonthFilter,
    before_3_months_ahead: before3MonthsFilter,
    last_30_days: last30daysFilter,
    last_7_days: last7daysFilter,
    last_24_hours: last24hoursFilter,
    last_8_hours: last8hoursFilter,
};

export const getDateFilters = () => [
    {
        labelBlock: gettext('Date created'),
        labelFrom: gettext('Created from'),
        labelTo: gettext('Created to'),
        fieldname: 'firstcreated',
        predefinedFilters: [last24hoursFilter, last7daysFilter, last30daysFilter],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date modified'),
        labelFrom: gettext('Modified from'),
        labelTo: gettext('Modified to'),
        fieldname: 'versioncreated',
        predefinedFilters: [last24hoursFilter, last7daysFilter, last30daysFilter],
        isEnabled: () => true,
    },
    {
        labelBlock: gettext('Date published'),
        labelFrom: gettext('Published from'),
        labelTo: gettext('Published to'),
        fieldname: 'firstpublished',
        predefinedFilters: [last24hoursFilter, last7daysFilter, last30daysFilter],
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
    const result = {};

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

    getDateFilters().forEach((dateFilter) => {
        const searchValueForFilter = search[dateFilter.fieldname];
        const predefinedFilter = dateFilter.predefinedFilters.find(
            (_predefinedFilter) => _predefinedFilter.key === searchValueForFilter,
        );

        if (predefinedFilter != null) {
            nextSearch = {
                ...search,
                ...elasticSearchDateRangeToFieldNames(
                    predefinedFilter.elasticSearchDateRange,
                    dateFilter.fieldname,
                ),
            };

            delete nextSearch[dateFilter.fieldname];
        }
    });

    return nextSearch;
}

export function mapPredefinedDateFiltersServerToClient(search) {
    const nextSearch = {...search};

    getDateFilters().forEach((dateFilter) => {
        dateFilter.predefinedFilters.forEach((predefinedFilter) => {
            const expectedSearch = elasticSearchDateRangeToFieldNames(
                predefinedFilter.elasticSearchDateRange,
                dateFilter.fieldname,
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
