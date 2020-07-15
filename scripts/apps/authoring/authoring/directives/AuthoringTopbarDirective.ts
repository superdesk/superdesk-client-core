import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {IArticleAction} from 'superdesk-api';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {addInternalEventListener} from 'core/internal-events';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdAuthoringTopbar
 *
 * @requires TranslationService
 *
 * @description Generates authoring subnav bar
 */
AuthoringTopbarDirective.$inject = ['TranslationService', 'privileges', 'authoringWorkspace'];
export function AuthoringTopbarDirective(
    TranslationService,
    privileges,
    authoringWorkspace: AuthoringWorkspaceService,
) {
    return {
        templateUrl: 'scripts/apps/authoring/views/authoring-topbar.html',
        link: function(scope) {
            function setActionsFromExtensions() {
                scope.articleActionsFromExtensions = [];

                getArticleActionsFromExtensions(scope.item).then((articleActions) => {
                    scope.articleActionsFromExtensions = articleActions;
                });
            }

            scope.additionalButtons = authoringWorkspace.authoringTopBarAdditionalButtons;
            scope.buttonsToHide = authoringWorkspace.authoringTopBarButtonsToHide;

            scope.saveDisabled = false;
            scope.getSpellchecker = getSpellchecker;
            scope.userHasPrivileges = privileges.userHasPrivileges;

            scope.handleArticleChange = (article) => {
                Object.assign(scope.item, article);

                scope.autosave(scope.item, 0);
            };

            /*
             * Save item
             * @return {promise}
             */
            scope.saveTopbar = function() {
                scope.saveDisabled = true;
                return scope.save(scope.item)
                    .finally(() => {
                        scope.saveDisabled = false;
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

            scope.triggerActionFromExtension = (actionToTrigger: IArticleAction) => {
                actionToTrigger.onTrigger();
            };

            scope.itemActionsHighlightsSectionDisplayed = () =>
                scope.articleActionsFromExtensions.some(({groupId}) => groupId === 'highlights')
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
        },
    };
}
