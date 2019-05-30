import {get} from 'lodash';
import {StageGroup} from '../directives/MonitoringGroup';

export const CUSTOM_SORT_SETTING = 'monitoring.customSortOfGroups';
export const DEFAULT_SORT_FIELD = 'default';

export type GroupSortOption = {
    label: string;
};

export type GroupSortOptions = {
    [field: string]: GroupSortOption
};

export default function getCustomSortForGroup(config: any, group: StageGroup): GroupSortOptions {
    if (!group.type) {
        return null;
    }

    const customConfig = get(config, CUSTOM_SORT_SETTING, {});
    const groupConfig = get(customConfig, group.type, null);

    return groupConfig;
}
