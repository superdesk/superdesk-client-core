import * as dateFns from 'date-fns';
import {IFieldsData} from 'superdesk-api';
import {getTimeStringIso} from '@superdesk/common';
import {IRundownItemBase} from '../../interfaces';
import {superdesk} from '../../superdesk';
const {nameof} = superdesk.helpers;

export function syncDurationWithEndTime(fieldId: string, fieldsData: IFieldsData): IFieldsData {
    if (fieldId === nameof<IRundownItemBase>('duration')) {
        const startTime = fieldsData.get(nameof<IRundownItemBase>('start_time'));
        const durationSeconds = fieldsData.get(
            nameof<IRundownItemBase>('duration'),
        );

        if (startTime == null) {
            return fieldsData;
        }

        return fieldsData.set(
            nameof<IRundownItemBase>('end_time'),
            durationSeconds == null
                ? null
                : getTimeStringIso(
                    dateFns.addSeconds(
                        new Date(`1970-01-01T${startTime}Z`),
                        durationSeconds as number,
                    ),
                ),
        );
    } else if (fieldId === nameof<IRundownItemBase>('end_time')) {
        const startTime = fieldsData.get(
            nameof<IRundownItemBase>('start_time'),
        ) as string;
        const endTime = fieldsData.get(
            nameof<IRundownItemBase>('end_time'),
        ) as string;

        if (startTime == null) {
            return fieldsData;
        }

        const endDate = new Date(`1970-01-01T${endTime}Z`);
        const startDate = new Date(`1970-01-01T${startTime}Z`);

        return fieldsData.set(
            nameof<IRundownItemBase>('duration'),
            endTime == null
                ? null
                : (endDate.getTime() - startDate.getTime()) / 1000,
        );
    } else {
        return fieldsData;
    }
}
