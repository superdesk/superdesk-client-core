import {ISuperdesk, IExtension} from 'superdesk-api';
import {AnnotationsLibraryPage} from './annotations-library-page';

var extension: IExtension = {
    activate: () => Promise.resolve(),
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
        pages: [
            {
                url: '/annotations-library',
                component: AnnotationsLibraryPage,
            },
        ],
    },
};

export default extension;
