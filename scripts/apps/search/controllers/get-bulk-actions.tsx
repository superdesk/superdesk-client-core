import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {canPrintPreview} from '../helpers';
import {ITEM_STATE} from 'apps/archive/constants';
import {IMultiActions} from './get-multi-actions';
import {IArticleActionBulkExtended} from 'apps/monitoring/MultiActionBarReact';
import {isOpenItemType} from '../directives/MultiActionBar';
import {showModal} from '@superdesk/common';
import {getModalForMultipleHighlights} from 'apps/highlights/components/SetHighlightsForMultipleArticlesModal';
import {dataApi} from 'core/helpers/CrudManager';
import {appConfig, authoringReactViewEnabled} from 'appConfig';
import {previewItems} from 'apps/authoring/preview/fullPreviewMultiple';
import React from 'react';
import {MultiEditModal} from 'apps/authoring-react/multi-edit-modal';

export function getBulkActions(
    articles: Array<IArticle>,
    multiActions: IMultiActions,
    getSelectedItems: () => Array<IArticle>,
    unselectAll: () => void,
    scopeApply: () => void,
): Array<IArticleActionBulkExtended> {
    const actions: Array<IArticleActionBulkExtended> = [];

    const authoring = ng.get('authoring');
    const desks = ng.get('desks');
    const privileges = ng.get('privileges');

    const {isLockedInCurrentSession, isLocked, isLockedByOtherUser, isPublished} = sdApi.article;

    const notLockedInOtherSession = articles.every((article) => isLockedInCurrentSession(article));
    const locked = articles.every((article) => isLocked(article));
    const nonePublished = articles.every((article) => !isPublished(article));

    if (articles.every(({state}) => state === ITEM_STATE.INGESTED)) {
        actions.push({
            label: gettext('Fetch'),
            icon: 'icon-archive',
            onTrigger: () => {
                multiActions.fetch();
                scopeApply?.();
            },
            canAutocloseMultiActionBar: false,
        });
        actions.push({
            label: gettext('Fetch to'),
            icon: 'icon-fetch-as',
            onTrigger: () => {
                multiActions.sendTo();
                scopeApply?.();
            },
            canAutocloseMultiActionBar: false,
        });

        if (multiActions.canRemoveIngestItems()) {
            actions.push({
                label: gettext('Remove'),
                icon: 'icon-trash',
                onTrigger: () => {
                    multiActions.removeIngestItems();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });
        }
    } else if (articles.every(({_type}) => _type === 'externalsource')) {
        actions.push({
            label: gettext('Fetch'),
            icon: 'icon-archive',
            onTrigger: () => {
                multiActions.fetch();
                scopeApply?.();
            },
            canAutocloseMultiActionBar: false,
        }, {
            label: gettext('Fetch to'),
            icon: 'icon-fetch-as',
            onTrigger: () => {
                multiActions.fetch(true);
                scopeApply?.();
            },
            canAutocloseMultiActionBar: false,
        });
    } else if (notLockedInOtherSession && articles.every((article) => article.state === ITEM_STATE.SPIKED)) {
        if (privileges.userHasPrivileges({unspike: 1})) {
            actions.push({
                label: gettext('Unspike'),
                icon: 'icon-unspike',
                onTrigger: () => {
                    multiActions.unspikeItems();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });
        }
    } else {
        if (notLockedInOtherSession && multiActions.canEditMetadata()) {
            actions.push({
                label: gettext('Edit metadata'),
                icon: 'icon-edit-line',
                onTrigger: () => {
                    multiActions.multiImageEdit();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });
        }

        if (articles.every((article) => !isLockedByOtherUser(article))) {
            actions.push({
                label: gettext('Export'),
                icon: 'icon-download',
                onTrigger: () => {
                    dispatchInternalEvent('openExportView', getSelectedItems().map(({_id}) => _id));
                },
                canAutocloseMultiActionBar: false,
            });
        }

        if (
            (notLockedInOtherSession || !locked)
            && articles.every((article) => authoring.itemActions(article).edit === true)
        ) {
            actions.push({
                label: gettext('Multi-edit'),
                icon: 'icon-multiedit',
                onTrigger: () => {
                    if (authoringReactViewEnabled) {
                        Promise.all(getSelectedItems().map((article) => {
                            if (isLockedInCurrentSession(article)) {
                                /**
                                 * using article doesn't work because it is missing properties
                                 * (at least slugline)
                                 */
                                return sdApi.article.get(article._id);
                            } else {
                                return sdApi.article.lock(article._id);
                            }
                        })).then((articlesLocked) => {
                            showModal(({closeModal}) => (
                                <MultiEditModal
                                    initiallySelectedArticles={articlesLocked}
                                    onClose={closeModal}
                                />
                            ));
                        });
                    } else {
                        multiActions.multiedit();
                        scopeApply?.();
                    }
                },
                canAutocloseMultiActionBar: false,
            });
        }

        if (
            articles.every((article) =>
                !isLockedByOtherUser(article)
                && article.state !== ITEM_STATE.SPIKED
                && !isPublished(article),
            )
        ) {
            actions.push({
                label: gettext('Spike'),
                icon: 'icon-trash',
                onTrigger: () => {
                    multiActions.spikeItems();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });
        }

        if (notLockedInOtherSession && nonePublished) {
            actions.push({
                label: gettext('Send to'),
                icon: 'icon-expand-thin',
                onTrigger: () => {
                    multiActions.sendTo();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });

            if (multiActions.canPublishItem()) {
                actions.push({
                    label: gettext('Publish'),
                    icon: 'icon-ok',
                    onTrigger: () => {
                        multiActions.publish();
                        scopeApply?.();
                    },
                    canAutocloseMultiActionBar: false,
                });
            }
        }

        if (notLockedInOtherSession) {
            actions.push({
                label: gettext('Duplicate To'),
                icon: 'icon-copy',
                group: {
                    label: gettext('Duplicate'),
                    icon: 'icon-copy',
                },
                onTrigger: () => {
                    multiActions.duplicateTo();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });

            actions.push({
                label: gettext('Duplicate In Place'),
                icon: 'icon-copy',
                group: {
                    label: gettext('Duplicate'),
                    icon: 'icon-copy',
                },
                onTrigger: () => {
                    multiActions.duplicateInPlace();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });
        }
    }

    if (multiActions.canPackageItems()) {
        if (!appConfig.features.hideCreatePackage) {
            actions.push({
                label: gettext('Create Package'),
                icon: 'icon-package-create',
                onTrigger: () => {
                    multiActions.createPackage();
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: false,
            });

            if (isOpenItemType('composite')) {
                actions.push({
                    label: gettext('Add to Current Package'),
                    icon: 'icon-package-plus',
                    onTrigger: () => {
                        multiActions.addToPackage();
                        scopeApply?.();
                    },
                    canAutocloseMultiActionBar: false,
                });
            }
        }

        const currentDeskId = desks.getCurrentDeskId();

        if (currentDeskId != null && multiActions.canHighlightItems()) {
            actions.push({
                label: gettext('Add to highlight'),
                icon: 'icon-star',
                onTrigger: () => {
                    showModal(getModalForMultipleHighlights(articles, currentDeskId));
                    scopeApply?.();
                },
                canAutocloseMultiActionBar: true,
            });
        }
    }

    if (articles.every((item) => canPrintPreview(item))) {
        actions.push({
            label: gettext('Print'),
            icon: 'icon-print',
            onTrigger: () => {
                const ids: Array<string> = getSelectedItems().map(({_id}) => _id);

                unselectAll();

                // fetching to ensure that the latest saved version is being previewed
                Promise.all(
                    ids.map((id) => dataApi.findOne<IArticle>('archive', id)),
                ).then((res: Array<IArticle>) => {
                    previewItems(res);
                });
            },
            canAutocloseMultiActionBar: false,
        });
    }

    if (articles.some((article) => article?.schedule_settings?.utc_publish_schedule)) {
        actions.push({
            label: gettext('Deschedule'),
            icon: 'icon-calendar',
            onTrigger: () => {
                multiActions.deschedule();
            },
            canAutocloseMultiActionBar: false,
        });
    }

    return actions;
}
