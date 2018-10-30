import {IArticle} from 'superdesk-interfaces/Article';

RelationsService.$inject = ['archiveService'];

export function RelationsService(archiveService) {
    this.getRelatedItems = function(item: IArticle) {
        if (!item.associations) {
            return [];
        }

        const related = Object.values(item.associations);
        const relatedWithoutNull = related.filter((o) => o !== null);
        const relatedWithoutMedia = related.filter((o) => o.type === 'text');
        const unpublished = relatedWithoutMedia.filter((o) => !archiveService.isPublished(o));

        return unpublished;
    };
}
