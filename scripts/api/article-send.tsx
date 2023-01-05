import React from 'react';
import {IArticle, IDesk, ISuperdeskQuery, IRestApiResponse} from 'superdesk-api';
import {ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {notNullOrUndefined, assertNever} from 'core/helpers/typescript-helpers';
import {
    getPublishingDatePatch,
    IPublishingDateOptions,
} from 'core/interactive-article-actions-panel/subcomponents/publishing-date-options';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {gettext, getItemLabel} from 'core/utils';
import {dispatchInternalEvent} from 'core/internal-events';
import {toElasticQuery} from 'core/query-formatting';
import {showModal} from '@superdesk/common';
import {ModalSimple, IModalSimpleAction} from 'core/ui/components/modal-simple';
import {UnorderedList} from 'core/ui/components/UnorderedList';

function getPublishedPackageItems(_package: IArticle): Promise<Array<IArticle>> {
    const query: ISuperdeskQuery = {
        filter: {$and: [{'guid': {$in: sdApi.article.getPackageItemIds(_package)}}]},
        page: 0,
        max_results: 200,
        sort: [{'versioncreated': 'asc'}],
    };

    return httpRequestJsonLocal<IRestApiResponse<IArticle>>({
        method: 'GET',
        path: '/search',
        urlParams: {
            repo: 'published',
            ...toElasticQuery(query),
        },
    }).then((res) => res._items);
}

function applyMiddlewares(
    items: Array<IArticle>,
    destination: ISendToDestination,
): Promise<void> {
    const selectedDeskObj: IDesk | null = (() => {
        if (destination.type === 'desk') {
            return sdApi.desks.getAllDesks().find((desk) => desk._id === destination.desk);
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
    );
}

function confirmSendingPackages(items: Array<IArticle>): Promise<void> {
    const packages = items.filter(({type}) => type === 'composite');

    if (packages.length < 1) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        Promise.all(
            packages.map((_package) => getPublishedPackageItems(_package).then((publishedPackageItems) => ({
                _package,
                publishedPackageItems,
            }))),
        ).then((res) => {
            const withPublishedItems = res.filter(({publishedPackageItems}) => publishedPackageItems.length > 0);

            if (withPublishedItems.length < 1) {
                resolve();
            } else {
                showModal(({closeModal}) => {
                    const actions: Array<IModalSimpleAction> = [
                        {
                            label: gettext('Cancel'),
                            onClick: () => {
                                closeModal();
                                reject();
                            },
                        },
                        {
                            label: gettext('Continue'),
                            onClick: () => {
                                closeModal();
                                resolve();
                            },
                            primary: true,
                        },
                    ];

                    return (
                        <ModalSimple title={gettext('Warning')} closeModal={closeModal} footerButtons={actions}>
                            {
                                (() => {
                                    if (withPublishedItems.length === 1) {
                                        const _package = withPublishedItems[0]._package;

                                        return (
                                            <div>
                                                <h3>
                                                    {
                                                        gettext(
                                                            'The package "{{name}}" contains the following '
                                                            + 'published items that can not be sent:',
                                                            {
                                                                name: getItemLabel(_package),
                                                            },
                                                        )
                                                    }
                                                </h3>

                                                <UnorderedList
                                                    items={withPublishedItems[0].publishedPackageItems.map(
                                                        (item) => getItemLabel(item),
                                                    )}
                                                />
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div>
                                                <h3>
                                                    {
                                                        gettext(
                                                            'Some packages contain the following '
                                                            + 'published items that can not be sent:',
                                                        )
                                                    }
                                                </h3>

                                                <br />

                                                {
                                                    withPublishedItems.map(({_package, publishedPackageItems}) => (
                                                        <div key={_package._id}>
                                                            <h3>{getItemLabel(_package)}</h3>

                                                            <UnorderedList
                                                                items={publishedPackageItems.map(
                                                                    (item) => getItemLabel(item),
                                                                )}
                                                            />
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        );
                                    }
                                })()
                            }
                        </ModalSimple>
                    );
                });
            }
        });
    });
}

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
    return applyMiddlewares(items, selectedDestination)
        .then(() => sendPackageItems ? confirmSendingPackages(items) : Promise.resolve())
        .then(() => {
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
                            const patchFinal = {
                                ...patch1,
                                ...patch2,
                            };

                            // TODO: fix server response to contain correct links or none at all
                            delete patchFinal['_links'];

                            return patchFinal;
                        });
                    });
                }),
            );
        }).then((patches: Array<Partial<IArticle>>) => {
            sdApi.preferences.update('destination:active', selectedDestination);
            notify.success(gettext('Sent successfully'));

            return patches;
        });
}
