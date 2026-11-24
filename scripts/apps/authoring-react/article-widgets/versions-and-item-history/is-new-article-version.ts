import {IArticle} from 'superdesk-api';

/**
 * A save creates a new version, so the versions and history tabs reload when it changes.
 */
export function isNewArticleVersion(previous: IArticle, next: IArticle): boolean {
    return previous._id !== next._id || previous._current_version !== next._current_version;
}
