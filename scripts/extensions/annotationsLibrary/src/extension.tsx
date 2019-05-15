import {ISuperdesk, IExtension, IPageComponentProps} from 'superdesk-api';
import * as React from 'react';

export class AnnotationsLibraryPage extends React.Component<IPageComponentProps> {
    render() {
        return <div>hello</div>;
    }
}

var extension: IExtension = {
    activate: (superdesk: ISuperdesk) => Promise.resolve(),
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
