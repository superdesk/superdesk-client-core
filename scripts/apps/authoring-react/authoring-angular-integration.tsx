/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
import {assertNever} from 'core/helpers/typescript-helpers';
import {
    ButtonGroup,
    NavButton,
    Tooltip,
} from 'superdesk-ui-framework/react';
import {
    IArticle,
    ITopBarWidget,
    IExposedFromAuthoring,
    IAuthoringOptions,
    IAuthoringActionType,
} from 'superdesk-api';
import {appConfig, extensions} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import React from 'react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import {
    authoringStorageIArticle,
    authoringStorageIArticleCorrect,
    getAuthoringStorageIArticleKillOrTakedown,
} from './data-layer';
import {
    IStateInteractiveActionsPanelHOC,
    IActionsInteractiveActionsPanelHOC,
} from 'core/interactive-article-actions-panel/index-hoc';
import {IArticleActionInteractive} from 'core/interactive-article-actions-panel/interfaces';
import {dispatchInternalEvent} from 'core/internal-events';
import {getSendAndDuplicateTarget} from 'apps/authoring/authoring/get-send-and-duplicate-target';
import {
    SaveButtonComponent,
    CloseButtonComponent,
    CloseIconButtonComponent,
    MinimizeButtonComponent,
    ToggleFullWidthComponent,
    ManageHighlightsComponent,
    ArchivedFromComponent,
    ReadOnlyLabelComponent,
    CorrectActionComponent,
    SendCorrectionComponent,
    KillActionComponent,
    TakedownActionComponent,
    UnpublishActionComponent,
    CancelAuthoringComponent,
    UpdateActionComponent,
    SendKillActionComponent,
    SendTakedownActionComponent,
    UnspikeComponent,
    DescheduleComponent,
    DeskAndStageComponent,
    LockInfoComponent,
    ExportHighlightComponent,
    PublishAndContinueComponent,
    EditButtonComponent,
    CloseAndContinueComponent,
    ToDeskComponent,
    SendAndDuplicateComponent,
    MarkedDesksComponent,
    PublishCorrectionComponent,
} from './toolbar-components/angular-integration';

function onClose() {
    ng.get('authoringWorkspace').close();
    ng.get('$rootScope').$applyAsync();
}

// Widget definitions without keyBindings - these use React Context hooks internally
const minimizeButton: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.3,
    component: MinimizeButtonComponent,
    availableOffline: true,
};

const toggleFullWidthButton: ITopBarWidget<IArticle> = {
    group: 'start',
    priority: 0.1,
    component: ToggleFullWidthComponent,
    availableOffline: true,
};

const manageHighlightsWidget: ITopBarWidget<IArticle> = {
    group: 'start',
    priority: 0.3,
    component: ManageHighlightsComponent,
    availableOffline: true,
};

const archivedFromWidget: ITopBarWidget<IArticle> = {
    group: 'start',
    availableOffline: false,
    component: ArchivedFromComponent,
    priority: 0.2,
};

const readOnlyWidget: ITopBarWidget<IArticle> = {
    group: 'start',
    availableOffline: false,
    component: ReadOnlyLabelComponent,
    priority: 0.3,
};

const correctAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: CorrectActionComponent,
    availableOffline: false,
};

const sendCorrectionAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: SendCorrectionComponent,
    availableOffline: false,
};

const killAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: KillActionComponent,
    availableOffline: false,
};

const takedownAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: TakedownActionComponent,
    availableOffline: false,
};

const unpublishAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: UnpublishActionComponent,
    availableOffline: false,
};

const cancelAuthoringAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: CancelAuthoringComponent,
    availableOffline: false,
};

const updateAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: UpdateActionComponent,
    availableOffline: false,
};

const sendKillAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: SendKillActionComponent,
    availableOffline: false,
};

const sendTakedownAction: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: SendTakedownActionComponent,
    availableOffline: false,
};

const unspikeWidget: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: UnspikeComponent,
    availableOffline: false,
};

const descheduleWidget: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: DescheduleComponent,
    availableOffline: false,
};

const deskAndStageWidget: ITopBarWidget<IArticle> = {
    group: 'start',
    priority: 0.2,
    component: DeskAndStageComponent,
    availableOffline: false,
};

const exportHighlightWidget: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.4,
    component: ExportHighlightComponent,
    availableOffline: false,
};

const publishAndContinueWidget: ITopBarWidget<IArticle> = {
    group: 'middle',
    priority: 0.3,
    component: PublishAndContinueComponent,
    availableOffline: false,
};

const editButtonWidget: ITopBarWidget<IArticle> = {
    group: 'middle',
    priority: 0.4,
    component: EditButtonComponent,
    availableOffline: false,
};

const closeAndContinueWidget: ITopBarWidget<IArticle> = {
    group: 'middle',
    priority: 0.4,
    component: CloseAndContinueComponent,
    availableOffline: false,
};

const toDeskWidget: ITopBarWidget<IArticle> = {
    group: 'middle',
    priority: 0.2,
    component: ToDeskComponent,
    availableOffline: false,
};

const sendAndDuplicateWidget: ITopBarWidget<IArticle> = {
    group: 'middle',
    priority: 0.2,
    component: SendAndDuplicateComponent,
    availableOffline: false,
};

const markedDesksWidget: ITopBarWidget<IArticle> = {
    group: 'start',
    priority: 0.3,
    component: MarkedDesksComponent,
    availableOffline: true,
};

const publishCorrectionWidget: ITopBarWidget<IArticle> = {
    group: 'end',
    priority: 0.1,
    component: PublishCorrectionComponent,
    availableOffline: false,
};

/**
 * Factory functions for widgets with keyBindings.
 * These capture the `exposed` parameter to avoid using module-level mutable state,
 * which prevents bugs when multiple authoring instances are rendered simultaneously.
 */
function getSaveButton(exposed: IExposedFromAuthoring<IArticle>): ITopBarWidget<IArticle> {
    return {
        group: 'end',
        priority: 0.2,
        component: SaveButtonComponent,
        availableOffline: true,
        keyBindings: {
            'ctrl+shift+s': () => {
                if (exposed.hasUnsavedChanges()) {
                    exposed.save();
                }
            },
        },
    };
}

function getCloseButton(exposed: IExposedFromAuthoring<IArticle>): ITopBarWidget<IArticle> {
    return {
        group: 'end',
        priority: 0.1,
        component: CloseButtonComponent,
        availableOffline: true,
        keyBindings: {
            'ctrl+shift+e': () => exposed.initiateClosing(),
        },
    };
}

function getCloseIconButton(exposed: IExposedFromAuthoring<IArticle>): ITopBarWidget<IArticle> {
    return {
        group: 'end',
        priority: 0.1,
        component: CloseIconButtonComponent,
        availableOffline: true,
        keyBindings: {
            'ctrl+shift+e': () => exposed.initiateClosing(),
        },
    };
}

function getLockInfoWidget(exposed: IExposedFromAuthoring<IArticle>): ITopBarWidget<IArticle> {
    return {
        group: 'start',
        priority: 0.1,
        component: LockInfoComponent,
        keyBindings: {
            'ctrl+shift+u': () => {
                if (sdApi.article.isLockedInOtherSession(exposed.item)) {
                    exposed.stealLock();
                }
            },
        },
        availableOffline: false,
    };
}

export function getInlineToolbarActions(
    options: IExposedFromAuthoring<IArticle>,
    action?: IAuthoringActionType,
    setFullWidth?: () => void,
    fullWidth?: boolean,
): IAuthoringOptions<IArticle> {
    const {item} = options;
    const itemState: ITEM_STATE = item.state;

    // Create widgets with keyBindings that capture the current exposed instance
    const saveButton = getSaveButton(options);
    const closeButton = getCloseButton(options);
    const closeIconButton = getCloseIconButton(options);
    const lockInfoWidget = getLockInfoWidget(options);

    // Context values for inline toolbar widgets using React Context
    const inlineToolbarContext = {
        setFullWidth: setFullWidth ?? null,
        fullWidth: fullWidth ?? false,
    };

    // Helper to add context to all return values
    const withContext = (
        opts: Omit<IAuthoringOptions<IArticle>, 'inlineToolbarContext'>,
    ): IAuthoringOptions<IArticle> => ({
        ...opts,
        inlineToolbarContext,
    });

    const getReadOnlyAndArchivedFrom = (): Array<ITopBarWidget<IArticle>> => {
        const actions: Array<ITopBarWidget<IArticle>> = [];

        if (item._type === 'archived') {
            actions.push(archivedFromWidget);
        }

        // `task` is absent on personal-space items, and the stage may not be resolvable
        // yet while the desks store is still loading
        const stage = item.task?.desk == null
            ? null
            : sdApi.desks.getDeskStages(item.task.desk).get(item.task.stage);

        if (item._type !== 'archived' && stage?.local_readonly === true) {
            actions.push(readOnlyWidget);
        }

        return actions;
    };

    if (action === 'kill') {
        return withContext({
            readOnly: false,
            actions: [toggleFullWidthButton, sendKillAction, closeIconButton, minimizeButton],
        });
    }

    if (action === 'takedown') {
        return withContext({
            readOnly: false,
            actions: [toggleFullWidthButton, sendTakedownAction, closeIconButton, minimizeButton],
        });
    }

    if (action === 'correct') {
        return withContext({
            readOnly: false,
            actions: [toggleFullWidthButton, sendCorrectionAction, cancelAuthoringAction, minimizeButton],
        });
    }

    const actions: Array<ITopBarWidget<IArticle>> = [
        toggleFullWidthButton,
        minimizeButton,
        closeButton,
        ...getReadOnlyAndArchivedFrom(),
    ];

    switch (itemState) {
        case ITEM_STATE.DRAFT:
            return withContext({
                readOnly: false,
                actions: [
                    toggleFullWidthButton, closeButton, saveButton, minimizeButton, ...getReadOnlyAndArchivedFrom(),
                ],
            });

        case ITEM_STATE.SUBMITTED:
        case ITEM_STATE.IN_PROGRESS:
        case ITEM_STATE.ROUTED:
        case ITEM_STATE.FETCHED:
        case ITEM_STATE.UNPUBLISHED:
            if (item.highlights != null) {
                actions.push(manageHighlightsWidget);
            }

            if (item.marked_desks?.length > 0) {
                actions.push(markedDesksWidget);
            }

            if (item._type !== 'archived') {
                actions.push(deskAndStageWidget);
            }

            if (sdApi.highlights.showHighlightExportButton(item)) {
                actions.push(exportHighlightWidget);
            }

            if (sdApi.article.showPublishAndContinue(item, options.hasUnsavedChanges())) {
                actions.push(publishAndContinueWidget);
            }

            if (action === 'view' && item._editable !== true) {
                actions.push(editButtonWidget);
            }

            if (sdApi.article.showCloseAndContinue(item, options.hasUnsavedChanges())) {
                actions.push(closeAndContinueWidget);
            }

            actions.push(lockInfoWidget);

            if (sdApi.article.isLockedInCurrentSession(item)) {
                actions.push(saveButton);
            }

            if (
                sdApi.article.isLockedInCurrentSession(item)
                && appConfig.features.customAuthoringTopbar?.toDesk === true
                && sdApi.article.isPersonal(item) !== true
            ) {
                actions.push(toDeskWidget);
            }

            if (
                appConfig.features?.customAuthoringTopbar?.sendAndDuplicate != null
                && getSendAndDuplicateTarget() != null
            ) {
                actions.push(sendAndDuplicateWidget);
            }

            return withContext({
                readOnly: sdApi.article.isLockedInCurrentSession(item) !== true,
                actions: actions,
            });

        case ITEM_STATE.INGESTED:
            return withContext({
                readOnly: true,
                actions: [],
            });

        case ITEM_STATE.SPIKED:
            return withContext({
                readOnly: true,
                actions: [unspikeWidget, toggleFullWidthButton, closeIconButton],
            });

        case ITEM_STATE.SCHEDULED:
            return withContext({
                readOnly: true,
                actions: [descheduleWidget, toggleFullWidthButton, closeIconButton],
            });

        case ITEM_STATE.PUBLISHED:
        case ITEM_STATE.CORRECTED:
            return withContext({
                readOnly: true,
                actions: [
                    toggleFullWidthButton,
                    updateAction,
                    correctAction,
                    takedownAction,
                    unpublishAction,
                    killAction,
                    closeIconButton,
                ],
            });

        case ITEM_STATE.BEING_CORRECTED:
            return withContext({
                readOnly: false,
                actions: [toggleFullWidthButton, closeIconButton, saveButton],
            });

        case ITEM_STATE.CORRECTION:
            return withContext({
                readOnly: false,
                actions: [
                    toggleFullWidthButton,
                    saveButton,
                    publishCorrectionWidget,
                    cancelAuthoringAction,
                ],
            });

        case ITEM_STATE.KILLED:
            return withContext({
                readOnly: true,
                actions: [toggleFullWidthButton, closeIconButton],
            });

        case ITEM_STATE.RECALLED:
            return withContext({
                readOnly: true,
                actions: [toggleFullWidthButton, closeIconButton],
            });
        default:
            assertNever(itemState);
    }
}

/**
 * True while the item is being corrected through the corrections workflow, as opposed to the
 * `correct` authoring action, which opens a separate editor. Mirrors `scope.isCorrection` in
 * `AuthoringTopbarDirective.ts`.
 */
function isCorrectionInProgress(article: IArticle, action?: IAuthoringActionType): boolean {
    return appConfig?.corrections_workflow === true
        && article.state === ITEM_STATE.CORRECTION
        && action === 'edit';
}

/**
 * Killed and recalled items have no onward transition left, and an archived item that
 * cannot be published cannot be sent either. The side widget this button replaces
 * declined to render in those cases; the panel host keeps that behaviour.
 *
 * Kill is the one authoring action with no send to / publish step of its own: the kill editor
 * carries its own Send kill button, so angular hides this control there
 * (`authoring-topbar.html`) and so do we. Correction is the opposite case, it is allowed
 * through explicitly because the panel is how a correction is sent.
 */
export function canOpenInteractiveActions(article: IArticle, action?: IAuthoringActionType): boolean {
    if (action === 'correct' || isCorrectionInProgress(article, action)) {
        return true;
    }

    if (action === 'kill') {
        return false;
    }

    if (article.state === ITEM_STATE.KILLED || article.state === ITEM_STATE.RECALLED) {
        return false;
    }

    return sdApi.article.canPublish(article) || article._type !== 'archived';
}

/**
 * An item in a correction must be sent through the correction API rather than the publish one,
 * so the panel offers the correct tab instead of publish and opens on it. Mirrors
 * `getAvailableTabs` / `getActiveTab` in `AuthoringTopbarDirective.ts`; the two must agree,
 * because both hosts open the same panel.
 */
export function getInteractiveActionsTabs(
    article: IArticle,
    action?: IAuthoringActionType,
): {tabs: Array<IArticleActionInteractive>; activeTab: IArticleActionInteractive} {
    if (action === 'correct' || isCorrectionInProgress(article, action)) {
        return {tabs: ['send_to', 'correct'], activeTab: 'correct'};
    }

    const tabs: Array<IArticleActionInteractive> = ['send_to'];

    if (sdApi.article.canPublish(article)) {
        tabs.push('publish');
    }

    return {
        tabs,
        activeTab: tabs.includes('publish') ? 'publish' : tabs[0],
    };
}

function getPublishToolbarWidget(
    panelState: IStateInteractiveActionsPanelHOC,
    panelActions: IActionsInteractiveActionsPanelHOC,
    action?: IAuthoringActionType,
): ITopBarWidget<IArticle> {
    const publishWidgetButton: ITopBarWidget<IArticle> = {
        priority: 99,
        availableOffline: false,
        group: 'end',
        component: (props: {entity: IArticle}) => !canOpenInteractiveActions(props.entity, action) ? null : (
            <ButtonGroup align="end">
                <ButtonGroup subgroup={true} spaces="no-space">
                    {/* `NavButton` renders `text` visibly only when it has no icon, so on its own
                        this control is named for screen readers but has no hover tooltip. Angular
                        sets both (`aria-label` and `sd-tooltip`, `authoring-topbar.html`). */}
                    <Tooltip text={gettext('Send to / Publish')} flow="left">
                        <NavButton
                            type="highlight"
                            icon="send-to"
                            iconSize="big"
                            text={gettext('Send to / Publish')}
                            data-test-id="open-send-publish-pane"
                            onClick={() => {
                                if (panelState.active) {
                                    panelActions.closePanel();
                                } else {
                                    const {tabs, activeTab} = getInteractiveActionsTabs(props.entity, action);

                                    dispatchInternalEvent('interactiveArticleActionStart', {
                                        items: [props.entity],
                                        tabs,
                                        activeTab,
                                    });
                                }
                            }}
                        />
                    </Tooltip>
                </ButtonGroup>
            </ButtonGroup>
        ),
    };

    return publishWidgetButton;
}

function getExtensionTopbarWidgets(): Array<ITopBarWidget<IArticle>> {
    return Object.values(extensions)
        .flatMap(({activationResult}) =>
            activationResult?.contributions?.authoringTopbarWidgets ?? [],
        )
        .map((item): ITopBarWidget<IArticle> => {
            const Component = item.component;

            return {
                ...item,
                component: (props: {entity: IArticle}) => (
                    <Component entity={props.entity} />
                ),
            };
        });
}

export function getAuthoringPrimaryToolbarWidgets(
    panelState: IStateInteractiveActionsPanelHOC,
    panelActions: IActionsInteractiveActionsPanelHOC,
    action?: IAuthoringActionType,
) {
    return getExtensionTopbarWidgets()
        .concat([getPublishToolbarWidget(panelState, panelActions, action)]);
}

/**
 * Multi-edit gets the extension widgets but not the send to / publish control.
 *
 * Publishing from a multi-edit board is not supported. The angular board offers only Remove item
 * and Save, and the react one could not route the panel anyway: `applicationState.articleInEditMode`
 * holds a single id, so only one of the open editors would ever respond to the panel event.
 */
export function getMultiEditPrimaryToolbarWidgets(): Array<ITopBarWidget<IArticle>> {
    return getExtensionTopbarWidgets();
}

export interface IProps {
    action?: IAuthoringActionType;
    itemId: IArticle['_id'];
    setFullWidth: () => void;
    fullWidth: boolean;
}

export class AuthoringAngularIntegration extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <div className="sd-authoring-react" data-test-id="authoring">
                <AuthoringIntegrationWrapper
                    sidebarMode={true}
                    getAuthoringPrimaryToolbarWidgets={
                        (panelState, panelActions) => getAuthoringPrimaryToolbarWidgets(
                            panelState,
                            panelActions,
                            this.props.action,
                        )
                    }
                    itemId={this.props.itemId}
                    onClose={onClose}
                    getInlineToolbarActions={(exposed) => getInlineToolbarActions(
                        exposed,
                        this.props.action,
                        this.props.setFullWidth,
                        this.props.fullWidth,
                    )}
                    authoringStorage={(() => {
                        if (this.props.action === 'kill' || this.props.action === 'takedown') {
                            return getAuthoringStorageIArticleKillOrTakedown(this.props.action);
                        } else if (this.props.action === 'correct') {
                            return authoringStorageIArticleCorrect;
                        } else {
                            return authoringStorageIArticle;
                        }
                    })()}
                />
            </div>
        );
    }
}
