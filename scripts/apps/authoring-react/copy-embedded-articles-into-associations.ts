import {CustomEditor3Entity} from 'core/editor3/constants';
import {getEntityMap} from 'core/editor3/helpers/get-entity-map';
import {IEditorDragDropArticleEmbed} from 'core/editor3/reducers/editor3';
import {ContentState} from 'draft-js';
import {IArticle} from 'superdesk-api';

export function copyEmbeddedArticlesIntoAssociations(contentState: ContentState, article: IArticle): void {
    /**
    * Putting embedded article into associations.
    * It's meant for external use after item is published.
    * see {@link AtomicBlockParser.parse}
    */
    getEntityMap(contentState).forEach((entity) => {
        if (entity.getType() === CustomEditor3Entity.ARTICLE_EMBED) {
            const data = entity.getData() as IEditorDragDropArticleEmbed['data'];
            const entityItem = data.item;

            if (article.associations == null) {
                article.associations = {};
            }

            article.associations[entityItem._id] = entityItem;
        }
    });
}