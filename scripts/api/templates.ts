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

function templatePost(payload) {
    return httpRequestJsonLocal<ITemplate>({
        method: 'POST',
        path: '/content_templates',
        payload,
    });
}

function templatePatch(payload, template: ITemplate) {
    return httpRequestJsonLocal<ITemplate>({
        method: 'PATCH',
        path: `/content_templates/${template._id}`,
        payload,
        headers: {'If-Match': template._etag},
    });
}

function createTemplateFromArticle(
    article: IArticle,
    templateName: string,
    selectedDeskId: IDesk['_id'] | null,
): Promise<ITemplate> {
    return getById(article.template).then((resultTemplate) => {
        const data = prepareData(resultTemplate);
        const deskId = selectedDeskId || data.desk;
        const articleTemplate = data.template;
        const item: IArticle = clone(ng.get('templates').pickItemData(article));
        const userId = ng.get('session').identity._id;

        return applyMiddleware(item).then((itemAfterMiddleware) => {
            // New template with the input name and 'default' settings
            const newTemplate: Partial<ITemplate> = {
                template_name: templateName,
                template_type: 'create',
                template_desks: selectedDeskId != null ? [deskId] : null,
                is_public: articleTemplate.is_public,
                data: itemAfterMiddleware,
            };

            let templateTemp: Partial<ITemplate> = articleTemplate != null ? articleTemplate : newTemplate;
            let diff = articleTemplate != null ? newTemplate : null;

            if (willCreateNew(articleTemplate, templateName, selectedDeskId != null)) {
                templateTemp = newTemplate;
                diff = null;

                if (!canEdit(articleTemplate, selectedDeskId != null)) {
                    templateTemp.is_public = false;
                    templateTemp.user = userId;
                    templateTemp.template_desks = null;
                }
            }

            const hasLinks = templateTemp._links != null;
            const payload: Partial<ITemplate> = diff != null ? cleanData(diff) : cleanData(templateTemp);

            // if the template is made private, set the current user as template owner
            if (articleTemplate.is_public && (diff?.is_public === false || templateTemp.is_public === false)) {
                payload.user = userId;
            }

            const requestPayload = {
                ...payload,
                data: cleanData(article),
            };

            return (hasLinks
                ? templatePatch(requestPayload, resultTemplate)
                : templatePost(requestPayload)
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
