import {get} from 'lodash';
import {StageGroup} from '../directives/MonitoringGroup';

export const CUSTOM_SORT_SETTING = 'monitoring.customSortOfGroups';
export const USE_DEFAULT_SORT_FIELD = null;

export type GroupSortOptions = Array<string>;

export default function getCustomSortForGroup(config: any, group: StageGroup): GroupSortOptions {
    if (!group.type) {
        return null;
    }

    const customConfig = get(config, CUSTOM_SORT_SETTING, {});
    const groupConfig: GroupSortOptions = get(customConfig, group.type, null);

    return groupConfig;
}
