import {IArticle, IDangerousArticlePatchingOptions} from 'superdesk-api';
import {patchArticle} from './article-patch';
import ng from 'core/services/ng';

const isLocked = (_article: IArticle) => _article.lock_session != null;
const isLockedInCurrentSession = (_article: IArticle) => _article.lock_session === ng.get('session').sessionId;
const isLockedInOtherSession = (_article: IArticle) => isLocked(_article) && !isLockedInCurrentSession(_article);
const isLockedByCurrentUser = (_article: IArticle) => _article.lock_user === ng.get('session').identity._id;
const isLockedByOtherUser = (_article: IArticle) => isLocked(_article) && !isLockedByCurrentUser(_article);
const isPublished = (_article: IArticle) => _article.item_id != null;
const isArchived = (_article: IArticle) => _article._type === 'archived';
const isPersonal = (_article: IArticle) =>
    _article.task == null || _article.task.desk == null || _article.task.stage == null;

interface IArticleApi {
    isLocked(article: IArticle): boolean;
    isLockedInCurrentSession(article: IArticle): boolean;
    isLockedInOtherSession(article: IArticle): boolean;
    isLockedByCurrentUser(article: IArticle): boolean;
    isLockedByOtherUser(article: IArticle): boolean;
    isArchived(article: IArticle): boolean;
    isPublished(article: IArticle): boolean;
    isPersonal(article: IArticle): boolean;
    patch(
        article: IArticle,
        patch: Partial<IArticle>,
        dangerousOptions?: IDangerousArticlePatchingOptions,
    ): Promise<void>;
}

export const article: IArticleApi = {
    isLocked,
    isLockedInCurrentSession,
    isLockedInOtherSession,
    isLockedByCurrentUser,
    isLockedByOtherUser,
    isArchived,
    isPublished,
    isPersonal,
    patch: patchArticle,
};
