/* eslint-disable react/no-multi-comp */
/* eslint-disable no-case-declarations */
import React from 'react';
import {Map} from 'immutable';
import {ButtonGroup, NavButton} from 'superdesk-ui-framework/react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {
    IArticle,
    IAuthoringAction,
    IArticleSideWidget,
    IContentProfileV2,
    IExtensionActivationResult,
    ITopBarWidget,
    IExposedFromAuthoring,
    IAuthoringStorage,
    IFieldsAdapter,
    IStorageAdapter,
    IRestApiResponse,
} from 'superdesk-api';
import {AuthoringReact} from './authoring-react';
import {authoringStorageIArticle} from './data-layer';
import {getFieldsAdapter} from './field-adapters';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {extensions} from 'appConfig';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {flatMap} from 'lodash';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {
    IActionsInteractiveActionsPanelHOC,
    IStateInteractiveActionsPanelHOC,
    WithInteractiveArticleActionsPanel,
} from 'core/interactive-article-actions-panel/index-hoc';
import {InteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-ui';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {CreatedModifiedInfo} from './subcomponents/created-modified-info';
import {dispatchInternalEvent} from 'core/internal-events';
import {IArticleActionInteractive} from 'core/interactive-article-actions-panel/interfaces';
import {ARTICLE_RELATED_RESOURCE_NAMES} from 'core/constants';
import {IProps} from './authoring-angular-integration';
import {showModal} from '@superdesk/common';
import {ExportModal} from './toolbar/export-modal';
import {TemplateModal} from './toolbar/template-modal';
import {TranslateModal} from './toolbar/translate-modal';
import {HighlightsModal} from './toolbar/highlights-modal';
import {CompareArticleVersionsModal} from './toolbar/compare-article-versions';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {getArticleAdapter} from './article-adapter';
import {ui} from 'core/ui-utils';
import {MarkForDesksModal} from './toolbar/mark-for-desks/mark-for-desks-modal';

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

const getCompareVersionsModal = (
    getLatestItem: () => IArticle,
    authoringStorage: IAuthoringStorage<IArticle>,
    fieldsAdapter: IFieldsAdapter<IArticle>,
    storageAdapter: IStorageAdapter<IArticle>,
): IAuthoringAction => ({
    label: gettext('Compare versions'),
    onTrigger: () => {
        const article = getLatestItem();

        Promise.all([
            httpRequestJsonLocal<IRestApiResponse<IArticle>>({
                method: 'GET',
                path: `/archive/${article._id}?version=all`,
            }),
            getArticleAdapter(),
        ]).then(([res, adapter]) => {
            const versions = res._items.map((item) => adapter.toAuthoringReact(item)).reverse();

            if (versions.length <= 1) {
                ui.alert(gettext('At least two versions are needed for comparison. This article has only one.'));
            } else {
                showModal(({closeModal}) => {
                    return (
                        <CompareArticleVersionsModal
                            closeModal={closeModal}
                            authoringStorage={authoringStorage}
                            fieldsAdapter={fieldsAdapter}
                            storageAdapter={storageAdapter}
                            versions={versions}
                            article={article}
                            getLanguage={() => article.language}
                        />
                    );
                });
            }
        });
    },
});

const getExportModal = (
    getLatestItem: () => IArticle,
    handleUnsavedChanges: () => Promise<IArticle>,
    hasUnsavedChanges: () => boolean,
): IAuthoringAction => ({
    label: gettext('Export'),
    onTrigger: () => {
        const openModal = (article: IArticle) => showModal(({closeModal}) => {
            return (
                <ExportModal
                    closeModal={closeModal}
                    article={article}
                />
            );
        });

        if (hasUnsavedChanges()) {
            handleUnsavedChanges().then((article) => openModal(article));
        } else {
            openModal(getLatestItem());
        }
    },
});

const getHighlightsAction = (getItem: () => IArticle): IAuthoringAction => {
    return {
        label: gettext('Highlights'),
        onTrigger: () => {
            sdApi.highlights.fetchHighlights().then((res) => {
                if ((res._items.length ?? 0) === 0) {
                    ui.alert(gettext('No highlights have been created yet.'));
                } else {
                    showModal(({closeModal}) => (
                        <HighlightsModal
                            article={getItem()}
                            closeModal={closeModal}
                        />
                    ));
                }
            });
        },
    };
};

const getSaveAsTemplate = (getItem: () => IArticle): IAuthoringAction => ({
    label: gettext('Save as template'),
    onTrigger: () => (
        showModal(({closeModal}) => {
            return (
                <TemplateModal
                    closeModal={closeModal}
                    item={getItem()}
                />
            );
        })
    ),
});


const getTranslateModal = (getItem: () => IArticle): IAuthoringAction => ({
    label: gettext('Translate'),
    onTrigger: () => {
        showModal(({closeModal}) => (
            <TranslateModal
                closeModal={closeModal}
                article={getItem()}
            />
        ));
    },
});

const getMarkedForDesksModal = (getItem: () => IArticle): IAuthoringAction => ({
    label: gettext('Marked for desks'),
    onTrigger: () => (
        showModal(({closeModal}) => {
            return (
                <MarkForDesksModal
                    closeModal={closeModal}
                    article={getItem()}
                />
            );
        })
    ),
});

interface IPropsWrapper extends IProps {
    onClose?(): void;
    getInlineToolbarActions?(options: IExposedFromAuthoring<IArticle>): {
        readOnly: boolean;
        actions: Array<ITopBarWidget<IArticle>>;
    };
    sidebarInitiallyVisible?: boolean;
}

/**
 * The purpose of the wrapper is to handle integration with the angular part of the application.
 * The main component will not know about angular.
 */

interface IState {
    isSidebarCollapsed: boolean;
}

export class AuthoringIntegrationWrapper extends React.PureComponent<IPropsWrapper, IState> {
    private authoringReactRef: AuthoringReact<IArticle> | null;

    constructor(props: IPropsWrapper) {
        super(props);

        this.state = {
            isSidebarCollapsed: this.props.sidebarInitiallyVisible ?? false,
        };

        this.prepareForUnmounting = this.prepareForUnmounting.bind(this);
        this.handleUnsavedChanges = this.handleUnsavedChanges.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
    }

    public toggleSidebar() {
        this.setState({isSidebarCollapsed: !this.state.isSidebarCollapsed});
    }

    public isSidebarCollapsed() {
        return this.state.isSidebarCollapsed;
    }

    public prepareForUnmounting() {
        if (this.authoringReactRef == null) {
            return Promise.resolve();
        } else {
            return this.authoringReactRef.initiateUnmounting();
        }
    }

    public handleUnsavedChanges(): Promise<void | IArticle> {
        if (this.authoringReactRef == null) {
            return Promise.resolve();
        } else if (this.authoringReactRef.state.initialized) {
            return this.authoringReactRef.handleUnsavedChanges(this.authoringReactRef.state);
        } else {
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

        const getSidebar = ({item, toggleSideWidget}) => {
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
        };

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
                            getActions={({
                                item,
                                contentProfile,
                                fieldsData,
                                getLatestItem,
                                handleUnsavedChanges,
                                hasUnsavedChanges,
                                authoringStorage,
                                fieldsAdapter,
                                storageAdapter,
                            }) => {
                                return Promise.all([
                                    getAuthoringActionsFromExtensions(item, contentProfile, fieldsData),
                                    getArticleActionsFromExtensions(item),
                                ]).then((res) => {
                                    const [authoringActionsFromExtensions, articleActionsFromExtensions] = res;

                                    return [
                                        getSaveAsTemplate(getLatestItem),
                                        getCompareVersionsModal(
                                            getLatestItem,
                                            authoringStorage,
                                            fieldsAdapter,
                                            storageAdapter,
                                        ),
                                        getHighlightsAction(getLatestItem),
                                        getMarkedForDesksModal(getLatestItem),
                                        getExportModal(getLatestItem, handleUnsavedChanges, hasUnsavedChanges),
                                        getTranslateModal(getLatestItem),
                                        ...authoringActionsFromExtensions,
                                        ...articleActionsFromExtensions,
                                    ];
                                });
                            }}
                            getInlineToolbarActions={this.props.getInlineToolbarActions}
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
                                getLatestItem,
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
                                            getLatestArticle={getLatestItem}
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
                            getSidebar={this.state.isSidebarCollapsed ? null : getSidebar}
                            topBar2Widgets={topbar2WidgetsReady}
                            validateBeforeSaving={false}
                        />
                    );
                }}
            </WithInteractiveArticleActionsPanel>
        );
    }
}
