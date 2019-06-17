import {get} from 'lodash';
import {StageGroup} from '../directives/MonitoringGroup';

type OrderType = 'desc' | 'asc';

export type GroupSortOptions = Array<string>;

export type GroupSortConfig = {
    default?: string, // field:order (publish_schedule:asc)
    options: GroupSortOptions
};

function isOrderType(o: string): o is OrderType {
    return ['desc', 'asc'].includes(o);
}

export function matchGroupToOrderConfig(group: StageGroup) {
    if (group._id.endsWith(':output')) {
        return 'monitoring.output.sort';
    } else if (group._id.endsWith(':scheduled')) {
        return 'monitoring.scheduled.sort';
    }

    return 'monitoring.stage.sort';
}

export default function getCustomSortForGroup(config: any, group: StageGroup): GroupSortConfig | null {
    if (!group || !group._id || !group.type) {
        return null;
    }

    const configForGroup = matchGroupToOrderConfig(group);
    const customConfig: GroupSortConfig = get(config, configForGroup, null);

    if (customConfig != null && customConfig.default) {
        const {field, order} = getDefaultFieldForConfig(customConfig);

        customConfig.default = `${field}:${order}`;
    }

    return customConfig;
}

export function getDefaultFieldForConfig(config: GroupSortConfig):
    {field: string, order: OrderType} | null {
    let [field, order] = config.default.split(':');

    if (!order || !isOrderType(order)) {
        order = 'asc';
    }

    // make sure default field exists in options
    if (!config.options.includes(field)) {
        return null;
    }

    return {
        field,
        order: order as OrderType,
    };
}
