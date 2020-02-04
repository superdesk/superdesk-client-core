import {pickBy, zipObject} from 'lodash';
import {IArticle} from 'superdesk-api';
import {isPublished} from 'apps/archive/utils';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

const RELATED_LINK_KEYS = 2; // links only have _id and type keys (and some old ones only _id)
const isLink = (association) => association != null && Object.keys(association).length <= RELATED_LINK_KEYS;

RelationsService.$inject = ['mediaIdGenerator', 'api', '$q'];

export function RelationsService(mediaIdGenerator, api, $q) {
    this.getRelatedKeys = function(item: IArticle, fieldId: string) {
        return Object.keys(item.associations || {})
            .filter((key) => key.startsWith(fieldId) && item.associations[key] != null)
            .sort();
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

    this.itemHasAllowedStatus = function(item: IArticle, field: IVocabulary) {
        const ALLOWED_WORKFLOWS = field?.field_options?.allowed_workflows || this.getDefaultAllowedWorkflows();

        return (ALLOWED_WORKFLOWS.published === true && isPublished(item)) ||
                        (ALLOWED_WORKFLOWS.in_progress === true && !isPublished(item));
    };
}
