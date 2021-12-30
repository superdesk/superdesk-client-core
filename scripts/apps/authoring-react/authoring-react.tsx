import React from 'react';
import {IArticle, IExtensionActivationResult} from 'superdesk-api';
import {
    Button,
    ButtonGroup,
    Loader,
    SubNav,
    IconButton,
    NavButton,
} from 'superdesk-ui-framework/react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {gettext} from 'core/utils';
import {IContentProfileV2, authoringStorage} from './data-layer';
import {AuthoringSection} from './authoring-section';
import {previewItems} from 'apps/authoring/preview/fullPreviewMultiple';
import {EditorTest} from './ui-framework-authoring-test';
import {extensions, uiFrameworkAuthoringPanelTest} from 'appConfig';
import {widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {AuthoringWidgetLayoutComponent} from './widget-layout-component';
import {WidgetHeaderComponent} from './widget-header-component';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {registerToReceivePatches, unregisterFromReceivingPatches} from 'apps/authoring-bridge/receive-patches';
import {addInternalEventListener, dispatchInternalEvent} from 'core/internal-events';
import {
    showUnsavedChangesPrompt,
    IUnsavedChangesActionWithSaving,
} from 'core/ui/components/prompt-for-unsaved-changes';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ITEM_STATE} from 'apps/search/interfaces';
import {WithInteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-hoc';
import {InteractiveArticleActionsPanel} from 'core/interactive-article-actions-panel/index-ui';
import {sdApi} from 'api';
import {IArticleActionInteractive} from 'core/interactive-article-actions-panel/interfaces';
import {AuthoringToolbar} from './subcomponents/authoring-toolbar';
import {DeskAndStage} from './subcomponents/desk-and-stage';
import {LockInfo} from './subcomponents/lock-info';
import {addInternalWebsocketEventListener, addWebsocketEventListener} from 'core/notification/notification';
import {ARTICLE_RELATED_RESOURCE_NAMES} from 'core/constants';
import {AuthoringActionsMenu} from './subcomponents/authoring-actions-menu';
import {CreatedModifiedInfo} from './subcomponents/created-modified-info';

interface IProps {
    itemId: IArticle['_id'];
    onClose(): void;
}

interface IStateLoaded {
    initialized: true;
    itemOriginal: IArticle;
    itemWithChanges: IArticle;
    profile: IContentProfileV2;
    openWidget?: {
        name: string;
        pinned: boolean;
    };

    /**
     * Prevents changes to state while async operation is in progress(e.g. saving).
     */
    loading: boolean;
}

type IState = {initialized: false} | IStateLoaded;

interface IAuthoringOptions {
    readOnly: boolean;
    actions: IExtensionActivationResult['contributions']['authoringTopbarWidgets'];
}

function waitForCssAnimation(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(
            () => {
                resolve();
            },
            500, // transition time taken from styles/sass/layouts.scss #authoring-container
        );
    });
}

export class AuthoringReact extends React.PureComponent<IProps, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.save = this.save.bind(this);
        this.stealLock = this.stealLock.bind(this);
        this.discardUnsavedChanges = this.discardUnsavedChanges.bind(this);
        this.handleClose = this.handleClose.bind(this);

        const setStateOriginal = this.setState.bind(this);

        this.setState = (...args) => {
            const {state} = this;

            // disallow changing state while loading (for example when saving is in progress)
            const allow: boolean = (() => {
                if (state.initialized !== true) {
                    return true;
                } else if (args[0]['loading'] === false) {
                    // it is allowed to change state while loading
                    // only if it sets loading to false
                    return true;
                } else {
                    return state.loading === false;
                }
            })();

            if (allow) {
                setStateOriginal(...args);
            }
        };

        widgetReactIntegration.pinWidget = () => {
            const state = this.state;

            if (state.initialized) {
                const nextState: IStateLoaded = {
                    ...state,
                    openWidget: {
                        ...state.openWidget,
                        pinned: !(state.openWidget?.pinned ?? false),
                    },
                };

                this.setState(nextState);
            }
        };
        widgetReactIntegration.getActiveWidget = () => {
            if (this.state.initialized) {
                return this.state.openWidget?.name ?? null;
            } else {
                return null;
            }
        };
        widgetReactIntegration.getPinnedWidget = () => {
            if (this.state.initialized) {
                const pinned = this.state.openWidget?.pinned === true;

                if (pinned) {
                    return this.state.openWidget.name;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        };

        widgetReactIntegration.closeActiveWidget = () => {
            const state = this.state;

            if (state.initialized) {
                const nextState: IStateLoaded = {
                    ...state,
                    openWidget: undefined,
                };

                this.setState(nextState);
            }
        };

        widgetReactIntegration.WidgetHeaderComponent = WidgetHeaderComponent;
        widgetReactIntegration.WidgetLayoutComponent = AuthoringWidgetLayoutComponent;
    }

    componentDidMount() {
        Promise.all(
            [
                authoringStorage.getArticle(this.props.itemId).then((item) => {
                    const itemCurrent = item.autosaved ?? item.saved;

                    return authoringStorage.getContentProfile(itemCurrent).then((profile) => {
                        return {item, profile};
                    });
                }),
                waitForCssAnimation(),
            ],
        ).then((res) => {
            const [{item, profile}] = res;

            const nextState: IStateLoaded = {
                initialized: true,
                loading: false,
                itemOriginal: item.saved,
                itemWithChanges: item.autosaved ?? item.saved,
                profile: profile,
            };

            this.setState(nextState);
        });

        registerToReceivePatches(this.props.itemId, (patch) => {
            const {state} = this;

            if (state.initialized) {
                this.setState({
                    ...state,
                    itemWithChanges: {
                        ...state.itemWithChanges,
                        ...patch,
                    },
                });
            }
        });

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.eventListenersToRemoveBeforeUnmounting.push(
            addInternalEventListener(
                'dangerouslyOverwriteAuthoringData',
                (event) => {
                    if (event.detail._id === this.props.itemId) {
                        const patch = event.detail;

                        const {state} = this;

                        if (state.initialized) {
                            if (state.itemOriginal === state.itemWithChanges) {
                                /**
                                 * if object references are the same before patching
                                 * they should be the same after patching too
                                 * in order for checking for changes to work correctly
                                 * (reference equality is used for change detection)
                                 */

                                const patched = {
                                    ...state.itemOriginal,
                                    ...patch,
                                };

                                this.setState({
                                    ...state,
                                    itemOriginal: patched,
                                    itemWithChanges: patched,
                                });
                            } else {
                                this.setState({
                                    ...state,
                                    itemWithChanges: {
                                        ...state.itemWithChanges,
                                        ...patch,
                                    },
                                    itemOriginal: {
                                        ...state.itemOriginal,
                                        ...patch,
                                    },
                                });
                            }
                        }
                    }
                },
            ),
        );

        /**
         * Update UI when locked in another session,
         * regardless whether by same or different user.
         */
        this.eventListenersToRemoveBeforeUnmounting.push(
            addInternalWebsocketEventListener('item:lock', (data) => {
                const {user, lock_session, lock_time, _etag} = data.extra;

                const state = this.state;

                /**
                 * Only patch these fields to preserve
                 * unsaved changes.
                 */
                const patch: Partial<IArticle> = {
                    _etag,
                    lock_session,
                    lock_time,
                    lock_user: user,
                    lock_action: 'edit',
                };

                if (state.initialized) {
                    if (state.itemOriginal === state.itemWithChanges) {
                        /**
                         * if object references are the same before patching
                         * they should be the same after patching too
                         * in order for checking for changes to work correctly
                         * (reference equality is used for change detection)
                         */

                        const patched = {
                            ...state.itemOriginal,
                            ...patch,
                        };

                        this.setState({
                            ...state,
                            itemOriginal: patched,
                            itemWithChanges: patched,
                        });
                    } else {
                        this.setState({
                            ...state,
                            itemOriginal: {
                                ...state.itemOriginal,
                                ...patch,
                            },
                            itemWithChanges: {
                                ...state.itemWithChanges,
                                ...patch,
                            },
                        });
                    }
                }
            }),
        );

        /**
         * Reload item if updated while locked in another session.
         * Unless there are unsaved changes.
         */
        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener('resource:updated', (event) => {
                const {_id, resource} = event.extra;
                const state = this.state;

                if (state.initialized !== true) {
                    return;
                }

                if (
                    ARTICLE_RELATED_RESOURCE_NAMES.includes(resource) !== true
                    || state.itemOriginal._id !== _id
                ) {
                    return;
                }

                if (sdApi.article.isLockedInCurrentSession(state.itemOriginal)) {
                    return;
                }

                const hasUnsavedChanges = state.itemWithChanges !== state.itemOriginal;

                if (hasUnsavedChanges) {
                    return;
                }

                authoringStorage.getArticle(state.itemOriginal._id).then((res) => {
                    const itemCurrent = res.autosaved ?? res.saved;

                    this.setState({
                        ...state,
                        itemOriginal: res.saved,
                        itemWithChanges: itemCurrent,
                    });
                });
            }),
        );
    }

    componentWillUnmount() {
        unregisterFromReceivingPatches();

        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    componentDidUpdate(_prevProps, prevState: IState) {
        if (
            this.state.initialized
            && prevState.initialized
            && sdApi.article.isLockedInCurrentSession(this.state.itemOriginal)
        ) {
            const itemWasSaved = this.state.itemOriginal === this.state.itemWithChanges;

            if (!itemWasSaved && this.state.itemWithChanges !== prevState.itemWithChanges) {
                if (this.state.itemWithChanges === this.state.itemOriginal) {
                    /**
                     * Item changed, but is now the same as original item.
                     * This means either article was saved, or changes discarded.
                     * In either case, autosaved data needs to be deleted.
                     */
                    authoringStorage.autosave.delete(this.state.itemWithChanges);
                } else {
                    authoringStorage.autosave.schedule(this.state.itemWithChanges);
                }
            }
        }
    }

    handleUnsavedChanges(state: IStateLoaded): Promise<Array<IArticle>> {
        return new Promise((resolve, reject) => {
            if (state.itemWithChanges === state.itemOriginal) {
                resolve([state.itemOriginal]);
                return;
            }

            return showUnsavedChangesPrompt(true).then(({action, closePromptFn}) => {
                if (action === IUnsavedChangesActionWithSaving.cancelAction) {
                    closePromptFn();
                    reject();
                } else if (action === IUnsavedChangesActionWithSaving.discardChanges) {
                    this.discardUnsavedChanges(state).then(() => {
                        closePromptFn();

                        if (this.state.initialized) {
                            resolve([this.state.itemOriginal]);
                        }
                    });
                } else if (action === IUnsavedChangesActionWithSaving.save) {
                    this.save(state).then(() => {
                        closePromptFn();

                        if (this.state.initialized) {
                            resolve([this.state.itemOriginal]);
                        }
                    });
                } else {
                    assertNever(action);
                }
            });
        });
    }

    save(state: IStateLoaded): Promise<IArticle> {
        authoringStorage.autosave.delete(state.itemWithChanges);

        this.setState({
            ...state,
            loading: true,
        });

        return authoringStorage.saveArticle(state.itemWithChanges, state.itemOriginal).then((item: IArticle) => {
            const nextState: IStateLoaded = {
                ...state,
                loading: false,
                itemOriginal: Object.freeze(item),
                itemWithChanges: item,
            };

            this.setState(nextState);

            return item;
        });
    }

    /**
     * Unlocks article from other user that holds the lock
     * and locks for current user.
     */
    stealLock(state: IStateLoaded) {
        const _id = state.itemOriginal._id;

        authoringStorage.unlock(_id).then(() => {
            authoringStorage.lock(_id).then((res) => {
                this.setState({
                    ...state,
                    itemOriginal: Object.freeze(res),
                    itemWithChanges: res,
                });
            });
        });
    }

    discardUnsavedChanges(state: IStateLoaded): Promise<void> {
        return authoringStorage.autosave.delete(state.itemWithChanges).then(() => {
            return new Promise((resolve) => {
                const stateNext: IStateLoaded = {
                    ...state,
                    itemWithChanges: state.itemOriginal,
                };

                this.setState(stateNext, () => {
                    resolve();
                });
            });
        });
    }

    handleClose(state: IStateLoaded) {
        this.setState({
            ...state,
            loading: true,
        });

        authoringStorage.closeAuthoring(
            state.itemWithChanges,
            state.itemOriginal,
            () => this.props.onClose(),
        ).then(() => {
            /**
             * The promise will also resolve
             * if user decides to cancel closing.
             */
            this.setState({
                ...state,
                loading: false,
            });
        });
    }

    getAuthoringOptions(state: IStateLoaded): IAuthoringOptions {
        const item = state.itemWithChanges;
        const itemState: ITEM_STATE = item.state;

        switch (itemState) {
        case ITEM_STATE.DRAFT:
            return {
                readOnly: false,
                actions: [],
            };

        case ITEM_STATE.SUBMITTED:
        case ITEM_STATE.IN_PROGRESS:
        case ITEM_STATE.ROUTED:
        case ITEM_STATE.FETCHED:
        case ITEM_STATE.UNPUBLISHED:
            return {
                readOnly: sdApi.article.isLockedInCurrentSession(item) !== true,
                actions: sdApi.article.isLockedInCurrentSession(item)
                    ? [
                        {
                            group: 'end',
                            priority: 0.2,
                            component: () => (
                                <Button
                                    text={gettext('Save')}
                                    style="filled"
                                    type="primary"
                                    disabled={state.itemWithChanges === state.itemOriginal}
                                    onClick={() => {
                                        this.save(state);
                                    }}
                                />
                            ),
                        },
                    ]
                    : [],
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

    render() {
        const state = this.state;

        if (state.initialized !== true) {
            return null;
        }

        // TODO: remove test code
        if (uiFrameworkAuthoringPanelTest) {
            return (
                <div className="sd-authoring-react">
                    <EditorTest />
                </div>
            );
        }

        const authoringOptions = this.getAuthoringOptions(state);
        const readOnly = state.initialized ? authoringOptions.readOnly : false;

        const widgetsFromExtensions = Object.values(extensions)
            .flatMap((extension) => extension.activationResult?.contributions?.authoringSideWidgets ?? [])
            .filter((widget) => widget.isAllowed?.(state.itemWithChanges) ?? true);

        const sidebarTabs: Array<ISideBarTab> = widgetsFromExtensions.map((widget) => ({
            icon: widget.icon,
            size: 'big',
            tooltip: widget.label,
            onClick: () => {
                const selfToggled = state.openWidget != null && widget.label === state.openWidget?.name;

                const nextState: IStateLoaded = {
                    ...state,
                    openWidget: selfToggled
                        ? undefined
                        : {name: widget.label, pinned: state.openWidget?.pinned ?? false},
                };

                this.setState(nextState);
            },
        }));

        const toolbar1Widgets: IExtensionActivationResult['contributions']['authoringTopbarWidgets'] = [
            ...authoringOptions.actions,
            {
                group: 'start',
                priority: 0.1,
                component: () => (
                    <LockInfo
                        article={state.itemWithChanges}
                        unlock={() => {
                            this.stealLock(state);
                        }}
                    />
                ),
            },
            {
                group: 'start',
                priority: 0.2,
                component: DeskAndStage,
            },
            {
                group: 'end',
                priority: 0.1,
                component: () => (
                    <Button
                        text={gettext('Close')}
                        style="hollow"
                        onClick={() => {
                            this.handleClose(state);
                        }}
                    />
                ),
            },
            {
                group: 'end',
                priority: 0.3,
                component: () => (
                    <NavButton
                        text={gettext('Minimize')}
                        onClick={() => {
                            this.props.onClose();
                        }}
                        icon="minimize"
                        iconSize="big"
                    />
                ),
            },
            {
                group: 'end',
                priority: 0.4,
                component: () => {
                    return (
                        <AuthoringActionsMenu item={state.itemWithChanges} />
                    );
                },
            },
        ];

        const topbar2Widgets = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.authoringTopbar2Widgets ?? []);

        const pinned = state.openWidget?.pinned === true;

        const defaultToolbarItems: Array<React.ComponentType<{article: IArticle}>> = [CreatedModifiedInfo];

        return (
            <div className="sd-authoring-react">
                {
                    state.loading && (
                        <Loader overlay />
                    )
                }

                <WithInteractiveArticleActionsPanel location="authoring">
                    {(panelState, panelActions) => {
                        const OpenWidgetComponent = (() => {
                            if (panelState.active === true) {
                                return () => (
                                    <InteractiveArticleActionsPanel
                                        items={panelState.items}
                                        tabs={panelState.tabs}
                                        activeTab={panelState.activeTab}
                                        handleUnsavedChanges={() => this.handleUnsavedChanges(state)}
                                        onClose={panelActions.closePanel}
                                        markupV2
                                    />
                                );
                            } else if (state.openWidget != null) {
                                return widgetsFromExtensions.find(
                                    ({label}) => state.openWidget.name === label,
                                ).component;
                            } else {
                                return null;
                            }
                        })();

                        return (
                            <Layout.AuthoringFrame
                                header={(
                                    <SubNav>
                                        <AuthoringToolbar
                                            itemOriginal={state.itemOriginal}
                                            itemWithChanges={state.itemWithChanges}
                                            coreWidgets={toolbar1Widgets}
                                        />

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
                                                                sdApi.article.canPublish(state.itemWithChanges);

                                                            if (canPublish) {
                                                                availableTabs.push('publish');
                                                            }

                                                            dispatchInternalEvent('interactiveArticleActionStart', {
                                                                items: [state.itemWithChanges],
                                                                tabs: availableTabs,
                                                                activeTab: canPublish ? 'publish' : availableTabs[0],
                                                            });
                                                        }
                                                    }}
                                                />
                                            </ButtonGroup>
                                        </ButtonGroup>
                                    </SubNav>
                                )}
                                main={(
                                    <Layout.AuthoringMain
                                        toolBar={(
                                            <React.Fragment>
                                                <div
                                                    style={{paddingRight: 16,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    {
                                                        defaultToolbarItems.concat(topbar2Widgets)
                                                            .map((Component, i) => {
                                                                return (
                                                                    <Component
                                                                        key={i}
                                                                        article={state.itemWithChanges}
                                                                    />
                                                                );
                                                            })
                                                    }
                                                </div>

                                                <ButtonGroup align="end">
                                                    <IconButton
                                                        icon="preview-mode"
                                                        ariaValue={gettext('Print preview')}
                                                        onClick={() => {
                                                            previewItems([state.itemOriginal]);
                                                        }}
                                                    />
                                                </ButtonGroup>
                                            </React.Fragment>
                                        )}
                                        authoringHeader={(
                                            <div>
                                                <AuthoringSection
                                                    fields={state.profile.header}
                                                    item={state.itemWithChanges}
                                                    onChange={(itemChanged) => {
                                                        const nextState: IStateLoaded = {
                                                            ...state,
                                                            itemWithChanges: itemChanged,
                                                        };

                                                        this.setState(nextState);
                                                    }}
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                        )}
                                    >
                                        <div>
                                            <AuthoringSection
                                                fields={state.profile.content}
                                                item={state.itemWithChanges}
                                                onChange={(itemChanged) => {
                                                    const nextState: IStateLoaded = {
                                                        ...state,
                                                        itemWithChanges: itemChanged,
                                                    };

                                                    this.setState(nextState);
                                                }}
                                                readOnly={readOnly}
                                            />
                                        </div>
                                    </Layout.AuthoringMain>
                                )}
                                sideOverlay={
                                    !pinned && OpenWidgetComponent != null
                                        ? (
                                            <OpenWidgetComponent
                                                article={{...state.itemWithChanges}}
                                            />
                                        )
                                        : undefined
                                }
                                sideOverlayOpen={!pinned && OpenWidgetComponent != null}
                                sidePanel={
                                    pinned && OpenWidgetComponent != null
                                        ? (
                                            <OpenWidgetComponent
                                                article={{...state.itemWithChanges}}
                                            />
                                        )
                                        : undefined
                                }
                                sidePanelOpen={pinned && OpenWidgetComponent != null}
                                sideBar={(
                                    <Nav.SideBarTabs
                                        items={sidebarTabs}
                                    />
                                )}
                            />
                        );
                    }}
                </WithInteractiveArticleActionsPanel>
            </div>
        );
    }
}
