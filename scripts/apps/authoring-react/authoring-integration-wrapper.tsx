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
    IExposedFromAuthoring,
    IAuthoringStorage,
    IFieldsAdapter,
    IStorageAdapter,
    IRestApiResponse,
    IFieldsData,
} from 'superdesk-api';
import {AuthoringReact} from './authoring-react';
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
import {showModal} from '@superdesk/common';
import {ExportModal} from './toolbar/export-modal';
import {TranslateModal} from './toolbar/translate-modal';
import {HighlightsModal} from './toolbar/highlights-modal';
import {CompareArticleVersionsModal} from './toolbar/compare-article-versions';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {getArticleAdapter} from './article-adapter';
import {ui} from 'core/ui-utils';
import {MultiEditToolbarAction} from './toolbar/multi-edit-toolbar-action';
import {MarkForDesksModal} from './toolbar/mark-for-desks/mark-for-desks-modal';
import {TemplateModal} from './toolbar/template-modal';

function getAuthoringActionsFromExtensions(
    item: IArticle,
    contentProfile: IContentProfileV2,
    fieldsData: Map<string, unknown>,
): Array<IAuthoringAction> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['getAuthoringActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.getAuthoringActions ?? [],
    );

    return flatMap(
        actionGetters.map((getPromise) => getPromise(item, contentProfile, fieldsData)),
    );
}

const defaultToolbarItems: Array<React.ComponentType<{article: IArticle}>> = [CreatedModifiedInfo];

interface IProps {
    itemId: IArticle['_id'];
}

const getCompareVersionsModal = (
    getLatestItem: IExposedFromAuthoring<IArticle>['getLatestItem'],
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

const getMultiEditModal = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => ({
    label: gettext('Multi-edit'),
    onTrigger: () => {
        showModal(({closeModal}) => (
            <MultiEditToolbarAction
                onClose={closeModal}
                initiallySelectedArticle={getItem()}
            />
        ));
    },
});

const getExportModal = (
    getLatestItem: IExposedFromAuthoring<IArticle>['getLatestItem'],
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

const getHighlightsAction = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => {
    const showHighlightsModal = () => {
        sdApi.highlights.fetchHighlights().then((res) => {
            if (res._items.length === 0) {
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
    };

    return {
        label: gettext('Highlights'),
        onTrigger: () => showHighlightsModal(),
        keyBindings: {
            'ctrl+shift+h': () => {
                showHighlightsModal();
            },
        },
    };
};

const getSaveAsTemplate = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => ({
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

const getTranslateModal = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => ({
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

const getMarkedForDesksModal = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => ({
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
    getAuthoringPrimaryToolbarWidgets?: (
        panelState: IStateInteractiveActionsPanelHOC,
        panelActions: IActionsInteractiveActionsPanelHOC,
    ) => Array<ITopBarWidget<IArticle>>;
    getInlineToolbarActions?(options: IExposedFromAuthoring<IArticle>): {
        readOnly: boolean;
        actions: Array<ITopBarWidget<IArticle>>;
    };

    // Hides the toolbar which includes the "Print Preview" button.
    hideSecondaryToolbar?: boolean;

    // If it's not passed then the sidebar is shown expanded and can't be collapsed.
    // If hidden is passed then it can't be expanded.
    // If it's set to true or false then it can be collapsed/expanded back.
    sidebarMode?: boolean | 'hidden';
    authoringStorage: IAuthoringStorage<IArticle>;
    onFieldChange?(
        fieldId: string,
        fieldsData: IFieldsData,
        computeLatestEntity: IExposedFromAuthoring<IArticle>['getLatestItem'],
    ): IFieldsData;
}

/**
 * The purpose of the wrapper is to handle integration with the angular part of the application.
 * The main component will not know about angular.
 */

interface IState {
    sidebarMode: boolean | 'hidden';
    sideWidget: null | {
        name: string;
        pinned: boolean;
    };
}

export class AuthoringIntegrationWrapper extends React.PureComponent<IPropsWrapper, IState> {
    private authoringReactRef: AuthoringReact<IArticle> | null;

    constructor(props: IPropsWrapper) {
        super(props);

        this.state = {
            sidebarMode: this.props.sidebarMode === 'hidden' ? 'hidden' : (this.props.sidebarMode ?? false),
            sideWidget: null,
        };

        this.prepareForUnmounting = this.prepareForUnmounting.bind(this);
        this.handleUnsavedChanges = this.handleUnsavedChanges.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
    }

    public toggleSidebar() {
        if (typeof this.state.sidebarMode === 'boolean') {
            this.setState({sidebarMode: !this.state.sidebarMode});
        }
    }

    public isSidebarCollapsed() {
        return this.state.sidebarMode != null;
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

        const getSidebar = (options: IExposedFromAuthoring<IArticle>) => {
            const sidebarTabs: Array<ISideBarTab> = getWidgetsFromExtensions(options.item)
                .map((widget) => {
                    const tab: ISideBarTab = {
                        icon: widget.icon,
                        size: 'big',
                        tooltip: widget.label,
                        id: widget.label,
                    };

                    return tab;
                });

            return (
                <Nav.SideBarTabs
                    activeTab={this.state.sideWidget?.name}
                    onActiveTabChange={(val) => {
                        this.setState({
                            sideWidget: {
                                name: val,
                                pinned: this.state.sideWidget?.pinned ?? false,
                            },
                        });
                    }}
                    items={sidebarTabs}
                />
            );
        };

        const secondaryToolbarWidgetsFromExtensions = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.authoringTopbar2Widgets ?? []);

        const secondaryToolbarWidgetsReady: Array<React.ComponentType<{item: IArticle}>> =
            defaultToolbarItems.concat(secondaryToolbarWidgetsFromExtensions).map(
                (Component) => (props: {item: IArticle}) => <Component article={props.item} />,
            );

        return (
            <WithInteractiveArticleActionsPanel location="authoring">
                {(panelState, panelActions) => {
                    return (
                        <AuthoringReact
                            themingEnabled
                            onFieldChange={this.props.onFieldChange}
                            hideSecondaryToolbar={this.props.hideSecondaryToolbar}
                            ref={(component) => {
                                this.authoringReactRef = component;
                            }}
                            itemId={this.props.itemId}
                            resourceNames={ARTICLE_RELATED_RESOURCE_NAMES}
                            onClose={() => this.props.onClose()}
                            authoringStorage={this.props.authoringStorage}
                            fieldsAdapter={getFieldsAdapter(this.props.authoringStorage)}
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
                            getLanguage={(article) => article.language ?? 'en'}
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
                                const authoringActionsFromExtensions = getAuthoringActionsFromExtensions(
                                    item,
                                    contentProfile,
                                    fieldsData,
                                );
                                const articleActionsFromExtensions = getArticleActionsFromExtensions(item);

                                return [
                                    getSaveAsTemplate(getLatestItem),
                                    getCompareVersionsModal(
                                        getLatestItem,
                                        authoringStorage,
                                        fieldsAdapter,
                                        storageAdapter,
                                    ),
                                    getMultiEditModal(getLatestItem),
                                    getHighlightsAction(getLatestItem),
                                    getMarkedForDesksModal(getLatestItem),
                                    getExportModal(getLatestItem, handleUnsavedChanges, hasUnsavedChanges),
                                    getTranslateModal(getLatestItem),
                                    ...authoringActionsFromExtensions,
                                    ...articleActionsFromExtensions,
                                ];
                            }}
                            getSidebarWidgetsCount={({item}) => getWidgetsFromExtensions(item).length}
                            sideWidget={this.state.sideWidget}
                            onSideWidgetChange={(sideWidget) => {
                                this.setState({sideWidget});
                            }}
                            getInlineToolbarActions={this.props.getInlineToolbarActions}
                            getAuthoringPrimaryToolbarWidgets={
                                this.props.getAuthoringPrimaryToolbarWidgets != null
                                    ? () => this.props.getAuthoringPrimaryToolbarWidgets(panelState, panelActions)
                                    : undefined
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
                                onItemChange,
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
                                        return getWidgetsFromExtensions(item).find((x) => {
                                            return sideWidget === x.label;
                                        }).component;
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
                                            onItemChange={onItemChange}
                                        />
                                    );
                                }
                            }}
                            getSidebar={this.state.sidebarMode !== true ? null : getSidebar}
                            secondaryToolbarWidgets={secondaryToolbarWidgetsReady}
                            validateBeforeSaving={false}
                            getSideWidgetNameAtIndex={(article, index) => {
                                return getWidgetsFromExtensions(article)[index].label;
                            }}
                        />
                    );
                }}
            </WithInteractiveArticleActionsPanel>
        );
    }
}
