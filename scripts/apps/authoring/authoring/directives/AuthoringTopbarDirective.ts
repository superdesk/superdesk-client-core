import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {IAuthoringAction} from 'superdesk-api';
import {getAuthoringActionsFromExtensions} from 'core/superdesk-api-helpers';
import {addInternalEventListener, dispatchInternalEvent} from 'core/internal-events';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import {IArticleActionInteractive} from 'core/interactive-article-actions-panel/interfaces';
import {IFullWidthPageCapabilityConfiguration} from 'superdesk-api';
import {sdApi} from 'api';
import {closedIntentionally} from 'apps/authoring/widgets/widgets';
import {partition} from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdAuthoringTopbar
 *
 * @requires TranslationService
 *
 * @description Generates authoring subnav bar
 */
AuthoringTopbarDirective.$inject = ['TranslationService', 'privileges', 'authoringWorkspace', '$q', 'superdeskFlags'];
export function AuthoringTopbarDirective(
    TranslationService,
    privileges,
    authoringWorkspace: AuthoringWorkspaceService,
    $q,
    superdeskFlags,
) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring-topbar.html',
        link: function(scope) {
            function setActionsFromExtensions() {
                const [nonPlanningActions, planningActions] = partition(
                    getAuthoringActionsFromExtensions(scope.item),
                    (action) => action.groupId !== 'planning-actions',
                );

                scope.nonPlanningActions = nonPlanningActions;
                scope.planningActions = planningActions;
            }

            scope.additionalButtons = authoringWorkspace.authoringTopBarAdditionalButtons;
            scope.buttonsToHide = authoringWorkspace.authoringTopBarButtonsToHide;
            scope.fullWidth = superdeskFlags.flags.hideMonitoring ?? false;
            scope.saveTopbarLoading = false;
            scope.getSpellchecker = getSpellchecker;
            scope.userHasPrivileges = privileges.userHasPrivileges;

            scope.isCorrection = (item) => appConfig?.corrections_workflow
                && item.state === ITEM_STATE.CORRECTION && scope.action === 'edit';

            scope.handleArticleChange = (article) => {
                Object.assign(scope.item, article);

                scope.autosave(scope.item, 0);
            };

            scope.openPublishOrSendToPane = () => {
                const availableTabs = getAvailableTabs();
                const activeTab = getActiveTab(availableTabs);

                dispatchInternalEvent('interactiveArticleActionStart', {
                    items: [scope.item],
                    tabs: availableTabs,
                    activeTab: activeTab,
                });
            };

            function getAvailableTabs(): Array<IArticleActionInteractive> {
                if (scope.isCorrection(scope.item)) {
                    return ['send_to', 'correct'];
                } else {
                    const result: Array<IArticleActionInteractive> = ['send_to'];

                    if (sdApi.article.canPublish(scope.item)) {
                        result.push('publish');
                    }

                    return result;
                }
            }

            function getActiveTab(availableTabs: Array<IArticleActionInteractive>): IArticleActionInteractive {
                if (availableTabs.includes('correct')) {
                    return 'correct';
                } else if (availableTabs.includes('publish')) {
                    return 'publish';
                } else {
                    return availableTabs[0];
                }
            }

            /*
             * Save item
             * @return {promise}
             */
            scope.saveTopbar = function() {
                scope.$applyAsync(() => {
                    scope.saveTopbarLoading = true;
                });

                // when very big articles being are saved(~14k words),
                // the browser can't animate the loading spinner properly
                // the delay is chosen so the spinner freezes in a visible state.
                const timeoutDuration = 600;

                return $q((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, timeoutDuration);
                })
                    .then(() => scope.save(scope.item))
                    .finally(() => {
                        scope.saveTopbarLoading = false;
                        scope.$applyAsync();
                    });
            };

            // Activate preview formatted item
            scope.previewFormattedItem = function() {
                scope.previewFormatted = true;
            };

            // Close preview formatted item
            scope.closePreviewFormatted = function() {
                scope.previewFormatted = false;
            };

            /*
             * Check if item is available for translating
             * @return {Boolean}
             */
            scope.isTranslationAvailable = function() {
                return TranslationService.checkAvailability(scope.item);
            };

            scope.triggerActionFromExtension = (actionToTrigger: IAuthoringAction) => {
                actionToTrigger.onTrigger();
            };

            scope.itemActionsHighlightsSectionDisplayed = () =>
                scope.nonPlanningActions.some(({groupId}) => groupId === 'highlights')
                || (
                    scope.item.task.desk
                    && (scope.itemActions.mark_item_for_desks || scope.itemActions.mark_item_for_highlight)
                );

            scope.$watch('item', () => {
                setActionsFromExtensions();
            }, true);

            const removeSaveEventListener = addInternalEventListener('saveArticleInEditMode', () => {
                scope.saveTopbar();
            });

            scope.$on('$destroy', () => {
                removeSaveEventListener();
            });

            scope.$watch(() => {
                return superdeskFlags.flags.hideMonitoring;
            }, (value) => {
                scope.fullWidth = value;
            });

            scope.setFullWidth = () => {
                scope.$applyAsync(() => {
                    closedIntentionally.value = true;
                    scope.hideMonitoring(true, new Event('click'));
                });
            };

            // This function is duplicated from the directive `WorkspaceSidenavDirective.ts`.
            scope.hideMonitoring = function(state, e) {
                const fullWidthConfig: IFullWidthPageCapabilityConfiguration
                    = scope.$parent.$parent.$parent.$parent.fullWidthConfig;

                if (fullWidthConfig.enabled) {
                    if (fullWidthConfig.allowed) {
                        fullWidthConfig.onToggle(!scope.fullWidthEnabled);
                    }
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (superdeskFlags.flags.authoring && state) {
                        e.preventDefault();
                        superdeskFlags.flags.hideMonitoring = !superdeskFlags.flags.hideMonitoring;
                    } else {
                        superdeskFlags.flags.hideMonitoring = false;
                        scope.superdeskFlags = false;
                    }
                }
            };
        },
    };
}
