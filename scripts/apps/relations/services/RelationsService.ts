import {pickBy, zipObject} from 'lodash';
import {IArticle} from 'superdesk-api';
import {isPublished} from 'apps/archive/utils';

const RELATED_LINK_KEYS = 2;

RelationsService.$inject = ['mediaIdGenerator', 'api', '$q'];

export function RelationsService(mediaIdGenerator, api, $q) {
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
        const relatedWithoutNull = related.filter((o) => o != null && Object.keys(o).length <= RELATED_LINK_KEYS);
        const relatedItems = relatedWithoutNull.map((o) => api.find('archive', o._id));

        return $q.all(relatedItems)
            .then((response) => {
                const unpublished = response.filter((o) => !isPublished(o));

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
            if (associations[key] && Object.keys(associations[key]).length <= RELATED_LINK_KEYS) {
                return api.find('archive', associations[key]._id);
            }

            return $q.when(associations[key]);
        })).then((values) => zipObject(relatedItemsKeys, values));
    };
}
