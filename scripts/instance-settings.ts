import {IInstanceSettings} from 'core/instance-settings-interface';
import {PartialDeep} from 'core/helpers/typescript-helpers';

export const defaultInstanceSettings: PartialDeep<IInstanceSettings> = {
    users: {
        minutesOnline: 15,
    },
};

export const instanceSettings: IInstanceSettings = {} as IInstanceSettings; // will be populated in loadInstanceSettings
