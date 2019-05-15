import {ISuperdesk, IExtension} from 'superdesk-api';

var extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        //
    },
    contribute: {
        sideMenuItems: (superdesk: ISuperdesk) => new Promise((resolve) => {
            const {gettext} = superdesk.localization;

            resolve([
                {
                    label: gettext('Annotations library'),
                    url: 'annotations-library',
                },
            ]);
        }),
    },
};

export default extension;
