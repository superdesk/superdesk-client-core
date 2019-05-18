import {ISuperdesk, IExtension} from 'superdesk-api';
import {AnnotationsLibraryPage} from './annotations-library-page';
import {getAnnotationInputWithKnowledgeBase} from './AnnotationInputWithKnowledgeBase';

var extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                editor3: {
                    annotationInputTabs: [
                        {
                            label: gettext('Annotations library'),
                            component: getAnnotationInputWithKnowledgeBase(superdesk),
                        },
                    ],
                },
                sideMenuItems: [
                    {
                        label: gettext('Annotations library'),
                        url: 'annotations-library',
                    },
                ],
                pages: [
                    {
                        title: gettext('Annotations library'),
                        url: '/annotations-library',
                        component: AnnotationsLibraryPage,
                    },
                ],
            },
        });
    },
};

export default extension;
