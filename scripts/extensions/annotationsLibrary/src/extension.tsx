import {ISuperdesk, IExtension, IRestApiResponse} from 'superdesk-api';
import {getAnnotationInputWithKnowledgeBase} from './AnnotationInputWithKnowledgeBase';
import {getAnnotationsLibraryPage} from './annotations-library-page';
import {getFields} from './GetFields';
import {IKnowledgeBaseItem} from './interfaces';

const RESOURCE = 'concept_items';

function annotationExistsInKnowledgeBase(superdesk: ISuperdesk, annotationText: string) {
    const {dataApi} = superdesk;
    const {nameField} = getFields(superdesk);
    const {generateFilterForServer} = superdesk.forms;

    return dataApi.query<IKnowledgeBaseItem>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {name: generateFilterForServer(nameField.type, annotationText)},
    ).then((res: IRestApiResponse<IKnowledgeBaseItem>) => res._items.length > 0);
}

function annotationFromLibraryTabSelectedByDefault(
    superdesk: ISuperdesk,
    annotationText: string,
    mode: 'create' | 'edit',
) {
    const {assertNever} = superdesk.helpers;

    if (mode === 'edit') {
        return Promise.resolve(false);
    } else if (mode === 'create') {
        return annotationExistsInKnowledgeBase(superdesk, annotationText);
    } else {
        return assertNever(mode);
    }
}

function onAnnotationCreate(superdesk: ISuperdesk, language: string, annotationText: string, definitionHtml: string) {
    annotationExistsInKnowledgeBase(superdesk, annotationText)
        .then((exists) => {
            // Don't create a knowledge base item for that annotation if it already exists
            if (!exists) {
                superdesk.dataApi.create(RESOURCE, {
                    language: language,
                    name: annotationText,
                    definition_html: definitionHtml,
                    cpnat_type: 'cpnat:abstract',
                });
            }
        });
}

var extension: IExtension = {
    id: 'annotationsLibrary',
    activate: (superdesk: ISuperdesk) => {
        const {gettext} = superdesk.localization;

        return Promise.resolve({
            contributions: {
                editor3: {
                    annotationInputTabs: [
                        {
                            label: gettext('Annotations library'),
                            component: getAnnotationInputWithKnowledgeBase(superdesk),
                            selectedByDefault: (annotationText: string, mode: 'create' | 'edit') =>
                                annotationFromLibraryTabSelectedByDefault(superdesk, annotationText, mode),
                            onAnnotationCreate: (language: string, annotationText: string, definitionHtml: string) => {
                                return onAnnotationCreate(superdesk, language, annotationText, definitionHtml);
                            },
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
