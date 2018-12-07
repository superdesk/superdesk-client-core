import {IArticle} from 'superdesk-interfaces/Article';

RelationsService.$inject = ['archiveService'];

export function RelationsService(archiveService) {
    this.getRelatedItems = function(item: IArticle) {
        if (!item.associations) {
            return [];
        }

        const related = Object.values(item.associations);
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
