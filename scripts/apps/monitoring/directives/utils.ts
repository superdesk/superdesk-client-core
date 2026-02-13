import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {COMPACT_LIST_VIEW, GRID_VIEW} from 'apps/archive/utils';
import {gettext} from 'core/utils';
import {flatMap} from 'lodash';
import {IMonitoringListFilter, IMonitoringListOperator} from 'superdesk-api';
import {IActiveFilters} from '../controllers/types';

export const FILTER_PREFIX = 'sd-filter';

const configFromExtensions = flatMap(
    Object.values(extensions),
    (extension) => extension.activationResult?.contributions?.monitoring?.listFiltersConfig,
);

/**
 * Instance config or fall back to default one
 */
export const listFiltersConfig: Array<IMonitoringListFilter> = configFromExtensions.length > 0
    ? configFromExtensions
    : [
        {
            label: gettext('Content Profile'),
            fieldId: 'contentProfile',
            getOptions: () => sdApi.contentProfiles.getAll()
                .filter(({enabled}) => enabled)
                .map((x) => ({id: x._id, label: x.label})),
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

/**
 * Filters that have their own components for display and must be ignored
 * in list of active filters rendered in scripts/apps/monitoring/directives/ActiveFilterTags.tsx
 */
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

export function getMonitoringViewOptions(
    options: {
        compactViewEnabled: boolean;
        swimlaneViewEnabled: boolean;
    },
): Array<{id: string; label: string; icon: string}> {
    const availableViews: Array<{id: string; label: string; icon: string}> = [];

    availableViews.push({
        id: COMPACT_LIST_VIEW,
        label: gettext('List view'),
        icon: 'list-view',
    });

    if (options.compactViewEnabled) {
        availableViews.push({
            id: 'compact-configurable',
            label: gettext('Compact View'),
            icon: 'unordered-list',
        });
    }

    if (options.swimlaneViewEnabled) {
        availableViews.push({
            id: 'swimlane',
            label: gettext('Swimlane View'),
            icon: 'kanban-view',
        });
    }

    availableViews.push({
        id: GRID_VIEW,
        label: gettext('Photo Grid View'),
        icon: 'grid-view',
    });

    return availableViews;
}
