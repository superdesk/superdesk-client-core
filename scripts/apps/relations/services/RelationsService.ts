import {pickBy} from 'lodash';
import {IArticle} from 'superdesk-interfaces/Article';

RelationsService.$inject = ['archiveService', 'mediaIdGenerator'];

export function RelationsService(archiveService, mediaIdGenerator) {
    this.getRelatedItemsWithoutMediaGallery = function(item: IArticle, fields) {
        if (!item.associations) {
            return [];
        }

        const relatedWithoutMedia = pickBy(item.associations, (value, key) => {
            var parts = mediaIdGenerator.getFieldParts(key);
            var field = fields.find((field) => field._id === parts[0]);

            return field && field.field_type === 'related_content';
        });

        const related = Object.values(relatedWithoutMedia);
        const relatedWithoutNull = related.filter((o) => o !== null);
        const unpublished = relatedWithoutNull.filter((o) => !archiveService.isPublished(o));

        return unpublished;
    };

    this.getRelatedKeys = function(item: IArticle, fieldId: string) {
        return Object.keys(item.associations || {})
            .filter((key) => key.startsWith(fieldId) && item.associations[key] != null)
            .sort();
    };

    this.getRelatedItemsForField = function(item: IArticle, fieldId: string) {
        const related = this.getRelatedKeys(item, fieldId);

        return related.reduce((obj, key) => {
            obj[key] = item.associations[key];
            return obj;
        }, {});
    };
}
