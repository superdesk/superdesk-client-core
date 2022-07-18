import {IISOTime} from 'superdesk-api';
import {IRundownItemBase} from '../interfaces';
import {addSeconds} from './add-seconds';

export function computeStartEndTime(
    showStartTime: IISOTime,
    items: Array<IRundownItemBase>,
): Array<IRundownItemBase> {
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
