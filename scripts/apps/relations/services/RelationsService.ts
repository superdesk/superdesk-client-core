import {zipObject} from 'lodash';
import {IArticle, IVocabularyMedia, IVocabularyRelatedContent} from 'superdesk-api';
import {isPublished, isIngested} from 'apps/archive/utils';
import {gettext} from 'core/utils';

const RELATED_LINK_KEYS = 3; // links only have _id, type keys and order (and some old ones only _id)

export const isLink = (association) =>
    association != null && Object.keys(association).length <= RELATED_LINK_KEYS;

export const defaultAllowedWorkflows = {
    in_progress: true,
    published: true,
    ingested: false,
};

export function validateWorkflow(
    mediaItem: IArticle,
    allowedWorkflowsConfig: Partial<typeof defaultAllowedWorkflows>,
): {result: true} | {result: false; error: string} {
    const allowedWorkflows = {
        ...defaultAllowedWorkflows,
        ...allowedWorkflowsConfig,
    };

    if (allowedWorkflows.published !== true && isPublished(mediaItem)) {
        return {
            result: false,
            error: gettext('Adding published items as related is not allowed due to configuration options'),
        };
    }

    if (allowedWorkflows.in_progress !== true && !isPublished(mediaItem)) {
        return {
            result: false,
            error: gettext(
                'Adding related items that are not published '
                + 'is not allowed due to configuration options',
            ),
        };
    }

    if (allowedWorkflows.ingested !== true && isIngested(mediaItem)) {
        return {
            result: false,
            error: gettext('Adding ingested items as related is not allowed due to configuration options'),
        };
    }

    return {result: true};
}

RelationsService.$inject = ['api', '$q'];

export function RelationsService(api, $q) {
    this.getRelatedKeys = function(item: IArticle, fieldId: string) {
        return Object.keys(item.associations || {})
            .filter((key) => key.startsWith(fieldId) && item.associations[key] != null)
            .sort((a, b) => item.associations[a].order - item.associations[b].order);
    };

    this.getRelatedItemsForField = function(item: IArticle, fieldId: string) {
        const relatedItemsKeys = this.getRelatedKeys(item, fieldId);
        const associations = item.associations || {};

        return $q.all(relatedItemsKeys.map((key) => {
            if (isLink(associations[key])) {
                return api.find('archive', associations[key]._id)
                    .catch((response) => {
                        if (response?.status === 404) {
                            return null;
                        }

                        return Promise.reject(response);
                    });
            }

            return $q.when(associations[key]);
        })).then((values) => zipObject(relatedItemsKeys, values));
    };

    this.itemHasAllowedStatus = function(item: IArticle, field: IVocabularyRelatedContent | IVocabularyMedia) {
        return validateWorkflow(item, field?.field_options?.allowed_workflows ?? {}).result;
    };
}
