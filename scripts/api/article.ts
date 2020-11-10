import {IArticle} from 'superdesk-api';

const isLocked = (_article: IArticle) => _article['lock_session'] != null;

interface IArticleApi {
    isLocked(article: IArticle): boolean;
}

export const article: IArticleApi = {
    isLocked,
};
