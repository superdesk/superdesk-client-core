import {IExtension, IExtensionActivationResult} from 'superdesk-api';
// import {superdesk} from './superdesk';

// const {gettext} = superdesk.localization;

// const field: ICustomFieldType<{}> = {
//     id: '',
// };

const result: IExtensionActivationResult = {
    contributions: {
        customFieldTypes: [
            {
                id: '',
            },
        ],
    },
};

const extension: IExtension = {
    activate: () => {
        return Promise.resolve(result);
    },
};

export default extension;
