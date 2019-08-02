import {pickBy, zipObject} from 'lodash';
import {IArticle} from 'superdesk-interfaces/Article';

const RELATED_LINK_KEYS = 2; // links only have _id and type keys (and some old ones only _id)
const isLink = (association) => association != null && Object.keys(association).length <= RELATED_LINK_KEYS;

RelationsService.$inject = ['archiveService', 'mediaIdGenerator', 'api', '$q'];
export function RelationsService(archiveService, mediaIdGenerator, api, $q) {
    this.getRelatedItemsWithoutMediaGallery = function(item: IArticle, fields) {
        if (!item.associations) {
            return [];
        }

        const relatedWithoutMedia = pickBy(item.associations, (value, key) => {
            var parts = mediaIdGenerator.getFieldParts(key);
            var field = fields.find((f) => f._id === parts[0]);

            return field && field.field_type === 'related_content';
        });

        const related = Object.values(relatedWithoutMedia);
        const relatedWithoutNull = related.filter(isLink);
        const relatedItems = relatedWithoutNull.map((o) => api.find('archive', o._id));

        return $q.all(relatedItems)
            .then((response) => {
                const unpublished = response.filter((o) => !archiveService.isPublished(o));

                return unpublished;
            });
    };

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
}
