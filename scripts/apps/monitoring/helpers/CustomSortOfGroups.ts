import {get} from 'lodash';
import {StageGroup} from '../directives/MonitoringGroup';

export type GroupSortOptions = Array<string>;

export function matchGroupToOrderConfig(group: StageGroup) {
    if (group._id.endsWith(':output')) {
        return 'monitoring.output.sort';
    } else if (group._id.endsWith(':scheduled')) {
        return 'monitoring.scheduled.sort';
    }

    return 'monitoring.stage.sort';
}

export default function getCustomSortForGroup(config: any, group: StageGroup): GroupSortOptions {
    if (!group || !group._id || !group.type) {
        return [];
    }

    const configForGroup = matchGroupToOrderConfig(group);
    const customConfig = get(config, configForGroup, []);

    return customConfig;
}
