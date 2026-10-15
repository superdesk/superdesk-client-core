import {IArticle, IDangerousArticlePatchingOptions} from 'superdesk-api';
import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {dataApi} from 'core/helpers/CrudManager';
import {dispatchInternalEvent} from 'core/internal-events';
import {logger} from 'core/services/logger';

/**
 * If article is locked in editing mode, it will apply the patch on top of existing changes
 * and run the same code as if user edited a field manually.
 * If article isn't locked, the patch will be sent directly to the server.
 *
 * The returned promise rejects when the patch does not reach the server, so callers that
 * report the outcome to the user must use this instead of {@link patchArticle}.
 */
export const patchArticleThrowing = (
    article: IArticle,
    patch: Partial<IArticle>,
    dangerousOptions?: IDangerousArticlePatchingOptions,
): Promise<void> => {
    const onPatchBeforeMiddlewares = Object.values(extensions)
        .map((extension) => extension.activationResult?.contributions?.entities?.article?.onPatchBefore)
        .filter((middleware) => middleware != null);

    return onPatchBeforeMiddlewares.reduce(
        (current, next) => current.then((result) => next(article._id, result, dangerousOptions)),
        Promise.resolve(patch),
    ).then((patchFinal) => {
        return dataApi.patchRaw<IArticle>(
            // distinction between handling published and non-published items
            // should be removed: SDESK-4687
            (sdApi.article.isPublished(article) ? 'published' : 'archive'),
            article._id,
            article._etag,
            patchFinal,
        ).then((res) => {
            if (dangerousOptions?.patchDirectlyAndOverwriteAuthoringValues === true) {
                dispatchInternalEvent(
                    'dangerouslyOverwriteAuthoringData',
                    {item: {...patch, _etag: res._etag, _id: res._id}},
                );
            }
        });
    });
};

/**
 * Same as {@link patchArticleThrowing}, except failures are logged and swallowed.
 *
 * This is what extensions get as `entities.article.patch`, and they call it without a rejection
 * handler, so the swallowing can not be removed without breaking them. New code that needs to
 * know whether the patch landed should use {@link patchArticleThrowing}.
 */
export const patchArticle = (
    article: IArticle,
    patch: Partial<IArticle>,
    dangerousOptions?: IDangerousArticlePatchingOptions,
): Promise<void> =>
    patchArticleThrowing(article, patch, dangerousOptions).catch((err) => {
        if (err instanceof Error) {
            logger.error(err);
        } else {
            // http errors reject with the parsed response body rather than an `Error`
            logger.error(new Error(`patching article ${article._id} failed`), err);
        }
    });
