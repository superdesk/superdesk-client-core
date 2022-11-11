/* eslint-disable react/no-multi-comp */
/* eslint-disable no-case-declarations */

import React from 'react';
import {Map} from 'immutable';
import {Button, ButtonGroup, NavButton} from 'superdesk-ui-framework/react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {
    IArticle,
    IAuthoringAction,
    IArticleSideWidget,
    IContentProfileV2,
    IExtensionActivationResult,
    ITopBarWidget,
    IBaseRestApiResponse,
} from 'superdesk-api';
import ng from 'core/services/ng';
import {AuthoringReact} from './authoring-react';
import {authoringStorageIArticle} from './data-layer';
import {getFieldsAdapter} from './field-adapters';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {appConfig, extensions} from 'appConfig';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {flatMap} from 'lodash';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {DeskAndStage} from './subcomponents/desk-and-stage';
import {LockInfo} from './subcomponents/lock-info';
import {
    IActionsInteractiveActionsPanelHOC,
    IStateInteractiveActionsPanelHOC,
    WithInteractiveArticleActionsPanel,
} from 'core/interactive-article-actions-panel/index-hoc';
import {InteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-ui';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {CreatedModifiedInfo} from './subcomponents/created-modified-info';
import {ITEM_STATE} from 'apps/archive/constants';
import {dispatchInternalEvent} from 'core/internal-events';
import {IArticleActionInteractive} from 'core/interactive-article-actions-panel/interfaces';
import {ARTICLE_RELATED_RESOURCE_NAMES} from 'core/constants';

function getAuthoringActionsFromExtensions(
    item: IArticle,
    contentProfile: IContentProfileV2,
    fieldsData: Map<string, unknown>,
): Promise<Array<IAuthoringAction>> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['getAuthoringActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.getAuthoringActions ?? [],
    );

    return Promise.all(actionGetters.map((getPromise) => getPromise(item, contentProfile, fieldsData)))
        .then((res) => {
            return flatMap(res);
        });
}

const defaultToolbarItems: Array<React.ComponentType<{article: IArticle}>> = [CreatedModifiedInfo];

interface IProps {
    itemId: IArticle['_id'];
}

function getPublishToolbarWidget(
    panelState: IStateInteractiveActionsPanelHOC,
    panelActions: IActionsInteractiveActionsPanelHOC,
): ITopBarWidget<IArticle> {
    const publishWidgetButton: ITopBarWidget<IArticle> = {
        priority: 99,
        availableOffline: false,
        group: 'end',
        // eslint-disable-next-line react/display-name
        component: (props: {entity: IArticle}) => (
            <ButtonGroup align="end">
                <ButtonGroup subgroup={true} spaces="no-space">
                    <NavButton
                        type="highlight"
                        icon="send-to"
                        iconSize="big"
                        text={gettext('Send to / Publish')}
                        onClick={() => {
                            if (panelState.active) {
                                panelActions.closePanel();
                            } else {
                                const availableTabs: Array<IArticleActionInteractive> = [
                                    'send_to',
                                ];

                                const canPublish =
                                    sdApi.article.canPublish(props.entity);

                                if (canPublish) {
                                    availableTabs.push('publish');
                                }

                                dispatchInternalEvent('interactiveArticleActionStart', {
                                    items: [props.entity],
                                    tabs: availableTabs,
                                    activeTab: canPublish ? 'publish' : availableTabs[0],
                                });
                            }
                        }}
                    />
                </ButtonGroup>
            </ButtonGroup>
        ),
    };

    return publishWidgetButton;
}

export class AuthoringAngularIntegration extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }

    onClose() {
        ng.get('authoringWorkspace').close();
        ng.get('$rootScope').$applyAsync();
    }

    getInlineToolbarActions(
        item,
        hasUnsavedChanges: () => boolean,
        handleUnsavedChanges: () => Promise<IArticle>,
        save: () => Promise<IArticle>,
        discardChangesAndClose: () => void,
        keepChangesAndClose: () => void,
        stealLock: () => void,
    ) {
        const itemState: ITEM_STATE = item.state;

        const saveButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 0.2,
            component: () => (
                <Button
                    text={gettext('Save')}
                    style="filled"
                    type="primary"
                    disabled={!hasUnsavedChanges()}
                    onClick={() => {
                        save();
                    }}
                />
            ),
            availableOffline: true,
        };

        const closeButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 0.1,
            component: () => (
                <Button
                    text={gettext('Close')}
                    style="hollow"
                    onClick={() => {
                        discardChangesAndClose();
                    }}
                />
            ),
            availableOffline: true,
        };

        const minimizeButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 0.3,
            component: () => (
                <NavButton
                    text={gettext('Minimize')}
                    onClick={() => {
                        keepChangesAndClose();
                    }}
                    icon="minimize"
                    iconSize="big"
                />
            ),
            availableOffline: true,
        };

        switch (itemState) {
        case ITEM_STATE.DRAFT:
            return {
                readOnly: false,
                actions: [saveButton, minimizeButton],
            };

        case ITEM_STATE.SUBMITTED:
        case ITEM_STATE.IN_PROGRESS:
        case ITEM_STATE.ROUTED:
        case ITEM_STATE.FETCHED:
        case ITEM_STATE.UNPUBLISHED:
            const actions: Array<ITopBarWidget<IArticle>> = [
                minimizeButton,
                closeButton,
            ];

            actions.push({
                group: 'start',
                priority: 0.2,
                component: ({entity}) => <DeskAndStage article={entity} />,
                availableOffline: false,
            });

            // FINISH: ensure locking is available in generic version of authoring
            actions.push({
                group: 'start',
                priority: 0.1,
                component: ({entity}) => (
                    <LockInfo
                        article={entity}
                        unlock={() => {
                            stealLock();
                        }}
                    />
                ),
                availableOffline: false,
            });

            if (sdApi.article.isLockedInCurrentSession(item)) {
                actions.push(saveButton);
            }

            if (
                sdApi.article.isLockedInCurrentSession(item)
                && appConfig.features.customAuthoringTopbar.toDesk === true
                && sdApi.article.isPersonal(item) !== true
            ) {
                actions.push({
                    group: 'middle',
                    priority: 0.2,
                    component: () => (
                        <Button
                            text={gettext('TD')}
                            style="filled"
                            onClick={() => {
                                handleUnsavedChanges()
                                    .then(() => sdApi.article.sendItemToNextStage(item))
                                    .then(() => discardChangesAndClose());
                            }}
                        />
                    ),
                    availableOffline: false,
                });
            }

            return {
                readOnly: sdApi.article.isLockedInCurrentSession(item) !== true,
                actions: actions,
            };

        case ITEM_STATE.INGESTED:
            return {
                readOnly: true,
                actions: [], // fetch
            };

        case ITEM_STATE.SPIKED:
            return {
                readOnly: true,
                actions: [], // un-spike
            };

        case ITEM_STATE.SCHEDULED:
            return {
                readOnly: true,
                actions: [], // un-schedule
            };

        case ITEM_STATE.PUBLISHED:
        case ITEM_STATE.CORRECTED:
            return {
                readOnly: true,
                actions: [], // correct update kill takedown
            };

        case ITEM_STATE.BEING_CORRECTED:
            return {
                readOnly: true,
                actions: [], // cancel correction
            };

        case ITEM_STATE.CORRECTION:
            return {
                readOnly: false,
                actions: [], // cancel correction, save, publish
            };

        case ITEM_STATE.KILLED:
        case ITEM_STATE.RECALLED:
            return {
                readOnly: true,
                actions: [], // NONE
            };
        default:
            assertNever(itemState);
        }
    }

    render(): React.ReactNode {
        return (
            <div className="sd-authoring-react">
                <AuthoringIntegrationWrapper
                    itemId={this.props.itemId}
                    onClose={this.onClose}
                    getInlineToolbarActions={this.getInlineToolbarActions}
                />
            </div>
        );
    }
}

interface IPropsWrapper<T> extends IProps {
    onClose?(): void;
    getInlineToolbarActions?(
        item: any, hasUnsavedChanges: () => boolean,
        handleUnsavedChanges: () => Promise<T>,
        save: () => Promise<T>,
        discardChangesAndClose: () => void,
        keepChangesAndClose: () => void,
        stealLock: () => void,
    ): {
        readOnly: boolean;
        actions: Array<ITopBarWidget<T>>;
    };
}

/**
 * The purpose of the wrapper is to handle integration with the angular part of the application.
 * The main component will not know about angular.
 */
export class AuthoringIntegrationWrapper extends React.PureComponent<IPropsWrapper<IArticle>> {
    private authoringReactRef: AuthoringReact<IArticle> | null;

    constructor(props: IPropsWrapper<IArticle>) {
        super(props);

        this.state = {};

        this.prepareForUnmounting = this.prepareForUnmounting.bind(this);
        this.handleUnsavedChanges = this.handleUnsavedChanges.bind(this);
    }

    public prepareForUnmounting() {
        if (this.authoringReactRef == null) {
            return Promise.resolve();
        } else {
            return this.authoringReactRef.prepareForUnmounting();
        }
    }

    public handleUnsavedChanges() {
        if (this.authoringReactRef == null) {
            return Promise.reject();
        } else {
            if (this.authoringReactRef.state.initialized) {
                return this.authoringReactRef.handleUnsavedChanges(this.authoringReactRef.state);
            }
            return Promise.reject();
        }
    }

    render() {
        function getWidgetsFromExtensions(article: IArticle): Array<IArticleSideWidget> {
            return Object.values(extensions)
                .flatMap((extension) => extension.activationResult?.contributions?.authoringSideWidgets ?? [])
                .filter((widget) => widget.isAllowed?.(article) ?? true)
                .sort((a, b) => a.order - b.order);
        }

        const topbar2WidgetsFromExtensions = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.authoringTopbar2Widgets ?? []);

        const topbar2WidgetsReady: Array<React.ComponentType<{item: IArticle}>> =
            defaultToolbarItems.concat(topbar2WidgetsFromExtensions).map(
                (Component) => (props: {item: IArticle}) => <Component article={props.item} />,
            );

        return (
            <WithInteractiveArticleActionsPanel location="authoring">
                {(panelState, panelActions) => {
                    return (
                        <AuthoringReact
                            ref={(component) => {
                                this.authoringReactRef = component;
                            }}
                            itemId={this.props.itemId}
                            resourceNames={ARTICLE_RELATED_RESOURCE_NAMES}
                            onClose={() => this.props.onClose()}
                            authoringStorage={authoringStorageIArticle}
                            fieldsAdapter={getFieldsAdapter(authoringStorageIArticle)}
                            storageAdapter={{
                                storeValue: (value, fieldId, article) => {
                                    return {
                                        ...article,
                                        extra: {
                                            ...(article.extra ?? {}),
                                            [fieldId]: value,
                                        },
                                    };
                                },
                                retrieveStoredValue: (item: IArticle, fieldId) => item.extra?.[fieldId] ?? null,
                            }}
                            getLanguage={(article) => article.language}
                            onEditingStart={(article) => {
                                dispatchCustomEvent('articleEditStart', article);
                            }}
                            onEditingEnd={(article) => {
                                dispatchCustomEvent('articleEditEnd', article);
                            }}
                            getActions={({item, contentProfile, fieldsData}) => {
                                return Promise.all([
                                    getAuthoringActionsFromExtensions(item, contentProfile, fieldsData),
                                    getArticleActionsFromExtensions(item),
                                ]).then((res) => {
                                    const [authoringActionsFromExtensions, articleActionsFromExtensions] = res;

                                    return [
                                        ...authoringActionsFromExtensions,
                                        ...articleActionsFromExtensions,
                                    ];
                                });
                            }}
                            getInlineToolbarActions={({
                                item,
                                hasUnsavedChanges,
                                handleUnsavedChanges,
                                save,
                                initiateClosing: discardChangesAndClose,
                                keepChangesAndClose,
                                stealLock,
                            }) => this.props.getInlineToolbarActions(
                                item,
                                hasUnsavedChanges,
                                handleUnsavedChanges,
                                save,
                                discardChangesAndClose,
                                keepChangesAndClose,
                                stealLock,
                            )}
                            getAuthoringTopBarWidgets={
                                () => Object.values(extensions)
                                    .flatMap(({activationResult}) =>
                                            activationResult?.contributions?.authoringTopbarWidgets ?? [],
                                    )
                                    .map((item): ITopBarWidget<IArticle> => {
                                        const Component = item.component;

                                        return {
                                            ...item,
                                            component: (props: {entity: IArticle}) => (
                                                <Component article={props.entity} />
                                            ),
                                        };
                                    })
                                    .concat([getPublishToolbarWidget(panelState, panelActions)])
                            }
                            getSidePanel={({
                                item,
                                contentProfile,
                                fieldsData,
                                handleFieldsDataChange,
                                fieldsAdapter,
                                storageAdapter,
                                authoringStorage,
                                handleUnsavedChanges,
                                sideWidget,
                            }, readOnly) => {
                                const OpenWidgetComponent = (() => {
                                    if (panelState.active === true) {
                                        return () => (
                                            <InteractiveArticleActionsPanel
                                                items={panelState.items}
                                                tabs={panelState.tabs}
                                                activeTab={panelState.activeTab}
                                                handleUnsavedChanges={
                                                    () => handleUnsavedChanges().then((res) => [res])
                                                }
                                                onClose={panelActions.closePanel}
                                                markupV2
                                            />
                                        );
                                    } else if (sideWidget != null) {
                                        return getWidgetsFromExtensions(item).find(
                                            ({label}) => sideWidget === label,
                                        ).component;
                                    } else {
                                        return null;
                                    }
                                })();

                                if (OpenWidgetComponent == null) {
                                    return null;
                                } else {
                                    return (
                                        <OpenWidgetComponent
                                            article={item}
                                            contentProfile={contentProfile}
                                            fieldsData={fieldsData}
                                            authoringStorage={authoringStorage}
                                            fieldsAdapter={fieldsAdapter}
                                            storageAdapter={storageAdapter}
                                            onFieldsDataChange={handleFieldsDataChange}
                                            readOnly={readOnly}
                                            handleUnsavedChanges={() => handleUnsavedChanges()}
                                        />
                                    );
                                }
                            }}
                            getSidebar={({item, toggleSideWidget}) => {
                                const sidebarTabs: Array<ISideBarTab> = getWidgetsFromExtensions(item)
                                    .map((widget) => ({
                                        icon: widget.icon,
                                        size: 'big',
                                        tooltip: widget.label,
                                        onClick: () => {
                                            toggleSideWidget(widget.label);
                                        },
                                    }));

                                return (
                                    <Nav.SideBarTabs
                                        items={sidebarTabs}
                                    />
                                );
                            }}
                            topBar2Widgets={topbar2WidgetsReady}
                            validateBeforeSaving={false}
                        />
                    );
                }}
            </WithInteractiveArticleActionsPanel>
        );
    }
}
