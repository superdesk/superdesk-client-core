import {ISuperdesk, IExtension, IRestApiResponse} from 'superdesk-api';
import {getAnnotationInputWithKnowledgeBase} from './AnnotationInputWithKnowledgeBase';
import {getAnnotationsLibraryPage} from './annotations-library-page';
import {getFields} from './GetFields';
import {IKnowledgeBaseItem} from './interfaces';

const RESOURCE = 'concept_items';

function getAnnotationsInKnowledgeBase(
    superdesk: ISuperdesk,
    annotationText: string,
): Promise<IRestApiResponse<IKnowledgeBaseItem>> {
    const {dataApi} = superdesk;
    const {nameField} = getFields(superdesk);
    const {generateFilterForServer} = superdesk.forms;

    return dataApi.query<IKnowledgeBaseItem>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {name: generateFilterForServer(nameField.type, annotationText)},
    );
}

function annotationExistsInKnowledgeBase(
    superdesk: ISuperdesk,
    annotationText: string,
    definitionHtml?: string,
): Promise<boolean> {
    return getAnnotationsInKnowledgeBase(superdesk, annotationText)
        .then((res: IRestApiResponse<IKnowledgeBaseItem>) => {
            if (definitionHtml == null) {
                // just searching for annotationText
                return res._items.length > 0;
            }

            // searching for exact match (text + definition)
            const matches = res._items.filter((item) => item.definition_html === definitionHtml);

            return matches.length > 0;
        });
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

function onAnnotationCreate(
    superdesk: ISuperdesk,
    language: string,
    annotationText: string,
    definitionHtml: string,
) {
    annotationExistsInKnowledgeBase(superdesk, annotationText, definitionHtml)
        .then((exists) => {
            // Don't create another annotation with the same text + definition
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
                        title: gettext('Annotations Library'),
                        url: '/annotations-library',
                        component: getAnnotationsLibraryPage(superdesk),
                    },
                ],
            },
        });
    },
};

export default extension;
