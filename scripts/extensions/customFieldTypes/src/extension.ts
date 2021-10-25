import {IExtension, IExtensionActivationResult} from 'superdesk-api';
// import {superdesk} from './superdesk';

const result: IExtensionActivationResult = {
    contributions: {
        customFieldTypes: [],
    },
};

const extension: IExtension = {
    activate: () => {
        return Promise.resolve(result);
    },
};

export default extension;
