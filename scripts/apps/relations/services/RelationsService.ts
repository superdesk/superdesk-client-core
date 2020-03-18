import {zipObject} from 'lodash';
import {IArticle, IArticleField} from 'superdesk-api';
import {isPublished} from 'apps/archive/utils';

const RELATED_LINK_KEYS = 3; // links only have _id, type keys and order (and some old ones only _id)
const isLink = (association) => association != null && Object.keys(association).length <= RELATED_LINK_KEYS;

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
                return api.find('archive', associations[key]._id);
            }

            return $q.when(associations[key]);
        })).then((values) => zipObject(relatedItemsKeys, values));
    };

    this.getDefaultAllowedWorkflows = function() {
        return {
            in_progress: true,
            published: true,
        };
    };

    this.itemHasAllowedStatus = function(item: IArticle, field: IArticleField) {
        const ALLOWED_WORKFLOWS = field?.field_options?.allowed_workflows || this.getDefaultAllowedWorkflows();

        return (ALLOWED_WORKFLOWS.published === true && isPublished(item)) ||
                        (ALLOWED_WORKFLOWS.in_progress === true && !isPublished(item));
    };
}
