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
 */
export const patchArticle = (
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
                    {...patch, _etag: res._etag, _id: res._id},
                );
            }
        });
    }).catch((err) => {
        if (err instanceof Error) {
            logger.error(err);
        }
    });
};
