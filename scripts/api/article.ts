import {IArticle} from 'superdesk-api';

const isLocked = (_article: IArticle) => _article['lock_session'] != null;
const isPublished = (_article: IArticle) => _article.item_id != null;

interface IArticleApi {
    isLocked(article: IArticle): boolean;
    isPublished(article: IArticle): boolean;
}

export const article: IArticleApi = {
    isLocked,
    isPublished,
};
