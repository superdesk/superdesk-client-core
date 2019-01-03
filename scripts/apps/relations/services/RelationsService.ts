import {IArticle} from 'superdesk-interfaces/Article';

RelationsService.$inject = ['archiveService', 'mediaIdGenerator'];

export function RelationsService(archiveService, mediaIdGenerator) {
    this.getRelatedItemsWithoutMediaGallery = function(item: IArticle, mediaFields: Dictionary<string, Array<number>>) {
        if (!item.associations) {
            return [];
        }

        const relatedWithoutMedia = _.pickBy(item.associations, (value, key) => {
            var parts = mediaIdGenerator.getFieldParts(key);

            return !_.includes(Object.keys(mediaFields), parts[0]);
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
