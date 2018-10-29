import {IArticle} from 'superdesk-interfaces/Article';

RelationsService.$inject = [];

export function RelationsService() {
    this.getRelatedItems = function(item: IArticle) {
        if (!item.associations) {
            return [];
        }

        const related = Object.values(item.associations);
        const relatedWithoutNull = related.filter((o) => o !== null);

        return relatedWithoutNull;
    };
}
