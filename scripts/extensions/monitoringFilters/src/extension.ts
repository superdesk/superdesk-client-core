import {IExtension, IExtensionActivationResult, IMonitoringListFiltersConfig, ISuperdesk} from 'superdesk-api';
import {configuration} from './configuration';
import {superdesk} from './superdesk';

const extension: IExtension = {
    activate: () => {
        const result: IExtensionActivationResult = {
            contributions: {
                monitoring: {
                    customListFiltersConfig: configuration,
                },
            },
        };

        return Promise.resolve(result);
    },
};

export function configure(fn: (superdesk: ISuperdesk) => IMonitoringListFiltersConfig) {
    const _configuration = fn(superdesk);

    Object.assign(configuration, _configuration);
}

export default extension;
