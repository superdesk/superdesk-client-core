import {applyMiddleware, canEdit, cleanData, prepareData, willCreateNew} from 'apps/authoring-react/toolbar/template-helpers';
import {httpRequestJsonLocal} from 'core/helpers/network';
import ng from 'core/services/ng';
import {IArticle, IDesk, ITemplate} from 'superdesk-api';

function getById(id: ITemplate['_id']): Promise<ITemplate> {
    return httpRequestJsonLocal<ITemplate>({
        method: 'GET',
        path: `/content_templates/${id}`,
    });
}

function save(article: IArticle, templateName: string, selectedDeskId: IDesk['_id'] | null): Promise<ITemplate> {
    return getById(article.template).then((resultTemplate) => {
        const data = prepareData(resultTemplate);
        const deskId = selectedDeskId || data.desk;
        const template = data.template;
        const item: IArticle = structuredClone(ng.get('templates').pickItemData(article));
        const userId = ng.get('session').identity._id;

        return applyMiddleware(item).then((itemAfterMiddleware) => {
            const data: Partial<ITemplate> = {
                template_name: templateName,
                template_type: 'create',
                template_desks: selectedDeskId != null ? [deskId] : null,
                is_public: template.is_public,
                data: itemAfterMiddleware,
            };

            let templateTemp: Partial<ITemplate> = template != null ? template : data;
            let diff = template != null ? data : null;

            if (willCreateNew(template, templateName, selectedDeskId != null)) {
                templateTemp = data;
                diff = null;

                if (!canEdit(template, selectedDeskId != null)) {
                    templateTemp.is_public = false;
                    templateTemp.user = userId;
                    templateTemp.template_desks = null;
                }
            }

            const hasLinks = templateTemp._links != null;
            const payload: Partial<ITemplate> = diff != null ? cleanData(diff) : cleanData(templateTemp);
            const path = hasLinks ? `/content_templates/${resultTemplate._id}` : '/content_templates';

            // if the template is made private, set the current user as template owner
            if (template.is_public && (diff?.is_public === false || templateTemp.is_public === false)) {
                payload.user = userId;
            }

            return httpRequestJsonLocal<ITemplate>({
                method: hasLinks ? 'PATCH' : 'POST',
                path,
                payload: {
                    ...payload,
                    data: cleanData(article),
                },
                headers: hasLinks ? {'If-Match': resultTemplate._etag} : null,
            }).then((_data) => {
                return _data;
            }, (response) => {
                return Promise.reject(response);
            });
        });
    });
}

export const templates = {
    getById,
    save,
    prepareData,
};
