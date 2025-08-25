import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {gettext} from 'core/utils';
import {IMonitoringListFilter, IMonitoringListOperator} from 'superdesk-api';
import {IActiveFilters} from '../controllers/types';

/**
 * Instance config or fall back to default one
 */
export const listFiltersConfig: Array<IMonitoringListFilter> =
    extensions?.['monitoring-filters']?.activationResult?.contributions?.monitoring?.listFiltersConfig
    ?? [
        {
            label: gettext('Content Profile'),
            fieldId: 'contentProfile',
            getOptions: () => sdApi.contentProfiles.getAll().map((x) => ({id: x._id, label: x.label})),
            selectMultiple: true,
            operator: 'OR',
        },
        {
            label: gettext('Categories'),
            fieldId: 'anpa_category.qcode',
            getOptions: () => sdApi.vocabularies
                .getAll().find((x) => x._id === 'categories').items
                .map((x) => ({id: x.qcode, label: x.name})),
            selectMultiple: true,
            operator: 'OR',
        },
    ];

const filtersToIgnore = ['fileType', 'customFilters'];

export const getTagsWithValues = (filters?: IActiveFilters) => {
    return Object.fromEntries(
        Object.entries(filters ?? {}).filter(([key, filters]) =>
            !filtersToIgnore.includes(key) && filters.length > 0,
        ),
    ) as Dictionary<string, Array<string>>;
};

type ITagConfig = Dictionary<
    string,
    {
        label: string;
        options: ReturnType<IMonitoringListFilter['getOptions']>;
        operator: IMonitoringListOperator;
    }
>;

export const getTagsConfig = (filterIds: Array<string>): ITagConfig => {
    return listFiltersConfig
        .filter((x) => filterIds.includes(x.fieldId))
        .reduce<ITagConfig>((prev, curr) => ({
            ...prev,
            [curr.fieldId]: {
                label: curr.label,
                options: curr.getOptions(),
                operator: curr.selectMultiple ? curr.operator : 'OR',
            },
        }), {});
};
