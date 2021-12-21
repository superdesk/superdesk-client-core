import {IArticle, IDesk} from 'superdesk-api';
import {ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {notNullOrUndefined, assertNever} from 'core/helpers/typescript-helpers';
import {getPublishingDatePatch, IPublishingDateOptions} from 'core/interactive-article-actions-panel/publishing-date-options';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {gettext} from 'core/utils';
import {dispatchInternalEvent} from 'core/internal-events';

/**
 * Promise may be rejected by middleware.
 * Returns patches, not whole items.
 */
export function sendItems(
    items: Array<IArticle>,
    selectedDestination: ISendToDestination,
    sendPackageItems: boolean = false,
    publishingDateOptions?: IPublishingDateOptions,
): Promise<Array<Partial<IArticle>>> {
    const selectedDeskObj: IDesk | null = (() => {
        if (selectedDestination.type === 'desk') {
            return sdApi.desks.getAllDesks().find((desk) => desk._id === selectedDestination.desk);
        } else {
            return null;
        }
    })();

    const middlewares = Object.values(extensions)
        .map((ext) => ext?.activationResult?.contributions?.entities?.article?.onSendBefore)
        .filter(notNullOrUndefined);

    return middlewares.reduce(
        (current, next) => {
            return current.then(() => {
                return next(items, selectedDeskObj);
            });
        },
        Promise.resolve(),
    ).then(() => {
        return Promise.all(
            items.map((item) => {
                return (() => {
                    if (Object.keys(publishingDateOptions ?? {}).length < 1) {
                        return Promise.resolve({});
                    }

                    /**
                     * If needed, update embargo / publish schedule / time zone
                     */

                    var patch = getPublishingDatePatch(item, publishingDateOptions);

                    if (Object.keys(patch).length > 0) {
                        return httpRequestJsonLocal<IArticle>({
                            method: 'PATCH',
                            path: `/archive/${item._id}`,
                            payload: patch,
                            headers: {
                                'If-Match': item._etag,
                            },
                        });
                    } else {
                        return Promise.resolve({});
                    }
                })().then((patch1: Partial<IArticle>) => {
                    const payload = (() => {
                        const basePayload = {};

                        if (sendPackageItems) {
                            basePayload['allPackageItems'] = true;
                        }

                        if (selectedDestination.type === 'personal-space') {
                            return basePayload;
                        } else if (selectedDestination.type === 'desk') {
                            const _payload: Partial<IArticle> = {
                                ...basePayload,
                                task: {
                                    desk: selectedDestination.desk,
                                    stage: selectedDestination.stage,
                                },
                            };

                            return _payload;
                        } else {
                            assertNever(selectedDestination);
                        }
                    })();

                    return httpRequestJsonLocal({
                        method: 'POST',
                        path: `/archive/${item._id}/move`,
                        payload: payload,
                    }).then((patch2: Partial<IArticle>) => {
                        notify.success(gettext('Item sent'));

                        sdApi.preferences.update('destination:active', selectedDestination);

                        return {
                            ...patch1,
                            ...patch2,
                        };
                    });
                });
            }),
        );
    }).then((patches: Array<Partial<IArticle>>) => {
        /**
         * Patch articles that are open in authoring.
         * Otherwise data displayed in authoring might be out of date
         * and _etag mismatch error would be thrown when attempting to save.
         */
        for (const patch of patches) {
            dispatchInternalEvent(
                'dangerouslyOverwriteAuthoringData',
                patch,
            );
        }

        return patches;
    });
}
