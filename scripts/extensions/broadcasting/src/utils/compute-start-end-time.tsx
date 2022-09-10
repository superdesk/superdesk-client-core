import {IRundownItem, IRundownItemBase} from '../interfaces';
import {addSeconds, ITimeISO} from '@superdesk/common';

export function computeStartEndTime<T extends IRundownItemBase | IRundownItem>(
    showStartTime: ITimeISO,
    items: Array<T>,
): Array<T> {
    let lastTime = showStartTime;

    return items.map((item) => {
        const startTime = lastTime;
        const endTime = addSeconds(lastTime, item.duration);

        lastTime = endTime;

        return {
            ...item,
            start_time: startTime,
            end_time: endTime,
        };
    });
}
