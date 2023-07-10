import {
    applyMiddleware,
    canEdit,
    cleanData,
    prepareData,
    willCreateNew,
} from 'apps/authoring-react/toolbar/template-helpers';
import {httpRequestJsonLocal} from 'core/helpers/network';
import ng from 'core/services/ng';
import {clone} from 'lodash';
import {IArticle, IDesk, ITemplate} from 'superdesk-api';

function getById(id: ITemplate['_id']): Promise<ITemplate> {
    return httpRequestJsonLocal<ITemplate>({
        method: 'GET',
        path: `/content_templates/${id}`,
    });
}

function createTemplate(payload) {
    return httpRequestJsonLocal<ITemplate>({
        method: 'POST',
        path: '/content_templates',
        payload,
    });
}

function updateTemplate(payload, template: ITemplate) {
    return httpRequestJsonLocal<ITemplate>({
        method: 'PATCH',
        path: `/content_templates/${template._id}`,
        payload,
        headers: {'If-Match': template._etag},
    });
}

/**
 * Creates or updates a template. If the article has an existing template it will be updated.
 *
 * @templateName - template name from the form input
 * @selectedDeskId - deskId selected in the form
 */
function createTemplateFromArticle(
    // The new template will be based on this article
    sourceArticle: IArticle,
    templateName: string,
    selectedDeskId: IDesk['_id'] | null,
): Promise<ITemplate> {
    return getById(sourceArticle.template).then((resultTemplate) => {
        const data = prepareData(resultTemplate);
        const deskId = selectedDeskId || data.desk;
        const templateArticle = data.template;

        // Clean the article from fields not usable for template creation
        const item: IArticle = clone(ng.get('templates').pickItemData(sourceArticle));
        const userId = ng.get('session').identity._id;

        return applyMiddleware(item).then((itemAfterMiddleware) => {
            const newTemplate: Partial<ITemplate> = {
                template_name: templateName,
                template_type: 'create',
                template_desks: selectedDeskId != null ? [deskId] : null,
                is_public: templateArticle.is_public,
                data: itemAfterMiddleware,
            };

            let templateTemp: Partial<ITemplate> = templateArticle != null ? templateArticle : newTemplate;
            let diff = templateArticle != null ? newTemplate : null;

            if (willCreateNew(templateArticle, templateName, selectedDeskId != null)) {
                templateTemp = newTemplate;
                diff = null;

                if (!canEdit(templateArticle, selectedDeskId != null)) {
                    templateTemp.is_public = false;
                    templateTemp.user = userId;
                    templateTemp.template_desks = null;
                }
            }

            const hasLinks = templateTemp._links != null;
            const payload: Partial<ITemplate> = diff != null ? cleanData(diff) : cleanData(templateTemp);

            // if the template is made private, set the current user as template owner
            if (templateArticle.is_public && (diff?.is_public === false || templateTemp.is_public === false)) {
                payload.user = userId;
            }

            const requestPayload: Partial<ITemplate> = {
                ...payload,
                data: item,
            };

            return (hasLinks
                ? updateTemplate(requestPayload, resultTemplate)
                : createTemplate(requestPayload)
            )
                .then((_data) => {
                    return _data;
                }, (response) => {
                    return Promise.reject(response);
                });
        });
    });
}

export const templates = {
    getById,
    createTemplateFromArticle,
    prepareData,
};
