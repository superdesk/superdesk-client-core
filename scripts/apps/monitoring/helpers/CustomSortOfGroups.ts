import {get} from 'lodash';
import {StageGroup} from '../directives/MonitoringGroup';
import {appConfig} from 'appConfig';

export type GroupSortOptions = Array<string>;

type OrderType = 'desc' | 'asc';

export type GroupSortConfig = {
    default?: { field: string, order: OrderType },
    allowed_fields_to_sort: GroupSortOptions
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

export default function getCustomSortForGroup(group: StageGroup): GroupSortConfig | null {
    if (!group || !group._id || !group.type) {
        return null;
    }

    const configForGroup = matchGroupToOrderConfig(group);
    const customConfig: GroupSortConfig = get(appConfig, configForGroup, null);

    if (customConfig && customConfig.default && !isOrderType(customConfig.default.order)) {
        console.warn(`Default sort order is not a valid string '${customConfig.default.order}'. Use 'asc' or 'desc'`);
        customConfig.default.order = 'asc';
    }

    return customConfig;
}
