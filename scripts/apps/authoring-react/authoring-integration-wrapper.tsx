/* eslint-disable react/no-multi-comp */
/* eslint-disable no-case-declarations */
/* eslint-disable react/display-name */
import React from 'react';
import {
    IArticle,
    IAuthoringAction,
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
import {appConfig, extensions} from 'appConfig';
import {getAuthoringActionsFromExtensions} from 'core/superdesk-api-helpers';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {notify} from 'core/notify/notify';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {
    IActionsInteractiveActionsPanelHOC,
    IStateInteractiveActionsPanelHOC,
    WithInteractiveArticleActionsPanel,
} from 'core/interactive-article-actions-panel/index-hoc';
import {InteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-ui';

import {ARTICLE_RELATED_RESOURCE_NAMES} from 'core/constants';
import {showModal} from '@sourcefabric/common';
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
import {WidgetStatePersistenceHOC, widgetState} from './widget-persistance-hoc';
import {PINNED_WIDGET_USER_PREFERENCE_SETTINGS, closedIntentionally} from 'apps/authoring/widgets/widgets';
import {
    SIDE_WIDGET_STORAGE_KEY,
    findWidgetById,
    getStoredStateForWidget,
    getWidgetsFromExtensions,
    readStoredSideWidget,
} from './side-widgets';
import {AuthoringIntegrationWrapperSidebar} from './authoring-integration-wrapper-sidebar';
import {assertNever} from 'core/helpers/typescript-helpers';
import {
    PrintPreviewButton,
    ToggleThemeButton,
    ConfigureThemeButton,
    CreatedModifiedInfoWidget,
    ContentProfileDropdownWidget,
    HeaderGeneralInfoWidget,
} from './toolbar-components/integration-wrapper';

const headerToolbarWidgetsStable: Array<ITopBarWidget<IArticle>> = [
    {
        component: ContentProfileDropdownWidget,
        availableOffline: false,
        group: 'start',
        priority: 1,
    },
    {
        component: HeaderGeneralInfoWidget,
        availableOffline: false,
        group: 'start',
        priority: 2,
    },
];

interface IProps {
    itemId: IArticle['_id'];
}

/**
 * Factory function for cosmetic action widgets with keyBindings.
 * Captures the `exposed` parameter to avoid using module-level mutable state,
 * which prevents bugs when multiple authoring instances are rendered simultaneously.
 */
function getAuthoringCosmeticActions(exposed: IExposedFromAuthoring<IArticle>): Array<ITopBarWidget<IArticle>> {
    return [
        {
            availableOffline: true,
            component: PrintPreviewButton,
            group: 'end',
            priority: 1,
            keyBindings: {'ctrl+shift+i': () => {
                exposed.printPreview();
            }},
        },
        {
            availableOffline: true,
            component: ToggleThemeButton,
            group: 'end',
            priority: 2,
            keyBindings: {'ctrl+shift+t': () => {
                exposed.toggleTheme();
            }},
        },
        {
            availableOffline: true,
            component: ConfigureThemeButton,
            group: 'end',
            priority: 3,
            keyBindings: {'ctrl+shift+c': () => {
                exposed.configureTheme();
            }},
        },
    ];
}

const secondaryToolbarWidgetsStable: Array<ITopBarWidget<IArticle>> = [
    {
        availableOffline: true,
        component: CreatedModifiedInfoWidget,
        group: 'start',
        priority: 1,
    },
];

export type ISideWidget = {
    activeId?: string;
    pinnedId?: string;
};

const getCompareVersionsModal = (
    getLatestItem: IExposedFromAuthoring<IArticle>['getLatestItem'],
    authoringStorage: IAuthoringStorage<IArticle>,
    fieldsAdapter: IFieldsAdapter<IArticle>,
    storageAdapter: IStorageAdapter<IArticle>,
): IAuthoringAction => ({
    label: gettext('Compare versions'),
    group: {id: 'general', priority: 0},
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
    label: gettext('Multiedit'),
    group: {id: 'general', priority: 0},
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
    group: {id: 'general', priority: 0},
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
        group: {id: 'highlights', priority: 20},
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
    group: {id: 'general', priority: 0},
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

const getLiveSuggestionsAction = (): IAuthoringAction => ({
    label: gettext('Live suggestions'),
    group: {id: 'general', priority: 0},
    onTrigger: () => {
        ng.get('suggest').setActive();
    },
});

const getTranslateModal = (getItem: IExposedFromAuthoring<IArticle>['getLatestItem']): IAuthoringAction => ({
    label: gettext('Translate item to'),
    group: {id: 'translations', label: gettext('Translations'), priority: 30},
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
    group: {id: 'highlights', priority: 20},
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

    autoFocus?: boolean; // defaults to true
}

/**
 * The purpose of the wrapper is to handle integration with the angular part of the application.
 * The main component will not know about angular.
 */

interface IState {
    sidebarMode: boolean | 'hidden';
    sideWidget: ISideWidget;
}

export class AuthoringIntegrationWrapper extends React.PureComponent<IPropsWrapper, IState> {
    private authoringReactRef: AuthoringReact<IArticle> | null;

    constructor(props: IPropsWrapper) {
        super(props);

        // the stored value is an `IOpenSideWidget`, not a bare id
        const widgetId: string | null = readStoredSideWidget()?.id ?? null;

        this.state = {
            sidebarMode: this.props.sidebarMode === 'hidden' ? 'hidden' : (this.props.sidebarMode ?? false),
            sideWidget: {
                pinnedId: widgetId,
                activeId: widgetId,
            },
        };

        this.prepareForUnmounting = this.prepareForUnmounting.bind(this);
        this.handleUnsavedChanges = this.handleUnsavedChanges.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.loadWidgetFromPreferences = this.loadWidgetFromPreferences.bind(this);
    }

    componentDidMount(): void {
        this.loadWidgetFromPreferences();
    }

    componentDidUpdate(_prevProps: IPropsWrapper, prevState: IState): void {
        if (
            this.state.sideWidget?.pinnedId != null
            && this.state.sideWidget?.pinnedId != prevState.sideWidget?.pinnedId
        ) {
            this.loadWidgetFromPreferences();
        }
    }

    private loadWidgetFromPreferences() {
        const pinnedWidgetPreference = sdApi.preferences.get(PINNED_WIDGET_USER_PREFERENCE_SETTINGS);
        const pinnedWidgetId = pinnedWidgetPreference?._id ?? null;

        if (pinnedWidgetId != null) {
            this.setState({
                sideWidget: {
                    pinnedId: pinnedWidgetId,
                    activeId: pinnedWidgetId,
                },
            });
        }
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

    public hasUnsavedChanges(): boolean {
        if (this.authoringReactRef == null) {
            return false;
        } else {
            return this.authoringReactRef.hasUnsavedChanges();
        }
    }

    public save(): Promise<void> {
        if (this.authoringReactRef == null) {
            return Promise.resolve();
        } else if (this.authoringReactRef.state.initialized) {
            return this.authoringReactRef.save(this.authoringReactRef.state).then(() => undefined);
        } else {
            return Promise.reject();
        }
    }

    public discardUnsavedChanges(): Promise<void> {
        if (this.authoringReactRef == null) {
            return Promise.resolve();
        } else if (this.authoringReactRef.state.initialized) {
            return this.authoringReactRef.discardUnsavedChanges(this.authoringReactRef.state);
        } else {
            return Promise.reject();
        }
    }

    render() {
        const secondaryToolbarWidgetsFromExtensions = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.authoringTopbar2Widgets ?? []);

        return (
            <WithInteractiveArticleActionsPanel location="authoring">
                {(panelState, panelActions) => (
                    <AuthoringReact
                        onFieldChange={this.props.onFieldChange}
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
                        headerToolbar={() => {
                            // Context is provided by AuthoringReact, so no need to update refs here
                            return headerToolbarWidgetsStable;
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
                            spellchecker,
                        }) => {
                            const authoringActionsFromExtensions = getAuthoringActionsFromExtensions(
                                item,
                                contentProfile,
                                fieldsData,
                            );

                            const actions = [
                                getSaveAsTemplate(getLatestItem),
                                ...(
                                    appConfig.features?.hideLiveSuggestions === true
                                        ? []
                                        : [getLiveSuggestionsAction()]
                                ),
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
                            ];

                            const getSpellcheckerAction = (): IAuthoringAction | null => {
                                if (appConfig.features.useTansaProofing !== true) {
                                    return {
                                        label: spellchecker.enabled
                                            ? gettext('Disable spellchecker')
                                            : gettext('Enable spellchecker'),
                                        group: {id: 'spellchecker', label: gettext('Spell Checker'), priority: 40},
                                        onTrigger: () => {
                                            spellchecker.setSpellcheckerStatus(!spellchecker.enabled);
                                        },
                                    } satisfies IAuthoringAction;
                                }

                                return null;
                            };

                            const getCheckSpellingAction = (): IAuthoringAction | null => {
                                if (appConfig.features.useTansaProofing === true) {
                                    return null;
                                }

                                const runCheck = () => {
                                    // Must match the editor3 `getLanguage` fallback, or this can
                                    // report "no dictionary" while the editor spellchecks with 'en'.
                                    const language = getLatestItem().language ?? 'en';
                                    const spellcheck = ng.get('spellcheck');
                                    const dictAvailable =
                                        spellcheck.isActiveDictionary
                                        || getSpellchecker(language) != null;

                                    if (!dictAvailable) {
                                        notify.error(gettext('No dictionary available for spell checking.'));
                                        return;
                                    }

                                    // Mirrors legacy SpellcheckMenuController.runSpellchecker: enables
                                    // auto-mode and re-runs the check. Calling with `true` when already
                                    // enabled re-dispatches the editor3 spellcheck via the existing event.
                                    spellchecker.setSpellcheckerStatus(true);
                                };

                                return {
                                    label: gettext('Check spelling'),
                                    group: {id: 'spellchecker', label: gettext('Spell Checker'), priority: 40},
                                    onTrigger: runCheck,
                                    keyBindings: {
                                        'ctrl+shift+y': runCheck,
                                    },
                                } satisfies IAuthoringAction;
                            };

                            const spellcheckerAction = getSpellcheckerAction();

                            if (spellcheckerAction != null) {
                                actions.push(spellcheckerAction);
                            }

                            const checkSpellingAction = getCheckSpellingAction();

                            if (checkSpellingAction != null) {
                                actions.push(checkSpellingAction);
                            }

                            return actions;
                        }}
                        getSidebarWidgetsCount={({item}) => getWidgetsFromExtensions(item).length}
                        sideWidget={this.state.sideWidget}
                        onSideWidgetChange={(sideWidget) => {
                            this.setState({sideWidget});
                            closedIntentionally.value = false;
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
                            getValidationErrors,
                            setValidationErrors,
                        }, readOnly) => {
                            if (panelState.active === true) {
                                return (
                                    <InteractiveArticleActionsPanel
                                        items={panelState.items}
                                        tabs={panelState.tabs}
                                        activeTab={panelState.activeTab}
                                        handleUnsavedChanges={
                                            () => handleUnsavedChanges().then((res) => [res])
                                        }
                                        onClose={panelActions.closePanel}
                                        onError={(error) => {
                                            if (error.kind === 'publishing-error') {
                                                setValidationErrors({
                                                    ...getValidationErrors(),
                                                    ...error.fields,
                                                });
                                            } else {
                                                assertNever(error.kind);
                                            }
                                        }}
                                        onDataChange={(item) => {
                                            onItemChange(item);
                                        }}
                                        markupV2
                                    />
                                );
                            }

                            const resolvedWidget = findWidgetById(item, sideWidget ?? null);

                            if (resolvedWidget == null) {
                                return null;
                            }

                            const WidgetComponent = resolvedWidget.component;

                            return (
                                <WidgetStatePersistenceHOC sideWidgetId={resolvedWidget._id}>
                                    {(widgetRef) => (
                                        <WidgetComponent
                                            ref={widgetRef}
                                            initialState={(() => {
                                                const localStorageWidgetState = readStoredSideWidget();
                                                const storedState = getStoredStateForWidget(
                                                    item,
                                                    resolvedWidget,
                                                    localStorageWidgetState,
                                                );

                                                if (storedState != null) {
                                                    sdApi.preferences.update(
                                                        PINNED_WIDGET_USER_PREFERENCE_SETTINGS,
                                                        {type: 'string', _id: resolvedWidget._id},
                                                    );

                                                    // Once a user switches the widget, authoring gets
                                                    // re-rendered 3-4 times, causing this logic to run more
                                                    // than once. To prevent wrong widget state its
                                                    // deleted after 5 seconds.
                                                    setTimeout(() => {
                                                        localStorage.removeItem(SIDE_WIDGET_STORAGE_KEY);
                                                    }, 5000);

                                                    closedIntentionally.value = false;
                                                    return storedState.initialState;
                                                }

                                                if (
                                                    localStorageWidgetState == null
                                                    && closedIntentionally.value === true
                                                    && widgetState[this.state.sideWidget?.activeId] != null
                                                ) {
                                                    return widgetState[this.state.sideWidget?.activeId];
                                                }

                                                return undefined;
                                            })()}
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
                                    )}
                                </WidgetStatePersistenceHOC>
                            );
                        }}
                        getSidebar={this.state.sidebarMode !== true ? null : (options) => (
                            <AuthoringIntegrationWrapperSidebar
                                options={options}
                                sideWidget={this.state.sideWidget}
                                setSideWidget={(sideWidget) => {
                                    this.setState({sideWidget});
                                    closedIntentionally.value = false;
                                }}
                            />
                        )}
                        getSecondaryToolbarWidgets={(exposed) => {
                            // Context is provided by AuthoringReact, so no need to update refs here
                            return [
                                ...secondaryToolbarWidgetsStable,
                                ...secondaryToolbarWidgetsFromExtensions,
                                ...getAuthoringCosmeticActions(exposed),
                            ];
                        }}
                        validateBeforeSaving={false}
                        getSideWidgetIdAtIndex={(article, index) => {
                            return getWidgetsFromExtensions(article)[index]._id;
                        }}
                        autoFocus={this.props.autoFocus}
                    />
                )}
            </WithInteractiveArticleActionsPanel>
        );
    }
}
