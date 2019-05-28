import {ISuperdesk, IExtension, IRestApiResponse} from 'superdesk-api';
import {getAnnotationInputWithKnowledgeBase} from './AnnotationInputWithKnowledgeBase';
import {getAnnotationsLibraryPage} from './annotations-library-page';
import {getFields} from './GetFields';
import {IKnowledgeBaseItem} from './interfaces';

function annotationFromLibraryTabSelectedByDefault(superdesk: ISuperdesk, annotationText: string) {
    const {dataApi} = superdesk;
    const {nameField} = getFields(superdesk);
    const {generateFilterForServer} = superdesk.forms;

    return dataApi.query<IKnowledgeBaseItem>(
        'concept_items',
        1,
        {field: 'name', direction: 'ascending'},
        {name: generateFilterForServer(nameField.type, annotationText)},
    ).then((res: IRestApiResponse<IKnowledgeBaseItem>) => res._items.length > 0);
}

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
                            selectedByDefault: (annotationText: string) =>
                                annotationFromLibraryTabSelectedByDefault(superdesk, annotationText),
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
