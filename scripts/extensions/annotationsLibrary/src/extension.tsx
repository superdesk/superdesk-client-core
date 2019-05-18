import {ISuperdesk, IExtension} from 'superdesk-api';
import {getAnnotationInputWithKnowledgeBase} from './AnnotationInputWithKnowledgeBase';
import { getAnnotationsLibraryPage } from './annotations-library-page';

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
                            selectedByDefault: () => Promise.resolve(true),
                        },
                    ],
                },
                pages: [
                    {
                        title: gettext('Annotations library'),
                        url: '/annotations-library',
                        component: getAnnotationsLibraryPage(superdesk),
                    },
                ],
            },
        });
    },
};

export default extension;
