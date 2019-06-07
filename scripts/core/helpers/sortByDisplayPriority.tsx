import {IDisplayPriority} from 'superdesk-api';
import {hasDebugSetting} from './debug-settings';

export function sortByDisplayPriority<T extends {label: string; priority?: IDisplayPriority}>(items: Array<T>) {
    const step = items.length < 10 ? 0.1 : parseFloat((0.9 / items.length).toFixed(3));
    let nextPriority = 0;

    const withDefaults: Array<T> = items.map((item) => {
        if (item.priority == null) {
            nextPriority += step;
            nextPriority = parseFloat(nextPriority.toFixed(3));

            return {
                ...item,
                priority: nextPriority,
            };
        } else {
            return item;
        }
    });

    const sorted = [...withDefaults].sort((a, b) => a.priority - b.priority);

    if (hasDebugSetting('logDisplayPriorities')) {
        console.table(sorted.map((item) => ([item.label, item.priority])));
    }

    return sorted;
}
