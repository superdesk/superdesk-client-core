import {get} from 'lodash';
import {gettext} from 'core/utils';
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
    const groupConfigWithLabels = {};

    for (let field in groupConfig) {
        groupConfigWithLabels[field] = groupConfig[field](gettext);
    }

    return groupConfig;
}
