import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {getMarkForUserModal} from '../../../../extensions/markForUser/src/get-mark-for-user-modal';
import {extensions} from 'core/extension-imports.generated';
import {showModal} from 'core/services/modalService';
import {IArticleAction} from 'superdesk-api';
import {get, flatMap} from 'lodash';

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

            scope.extraActionsFromExtensions = [];

            scope.triggerActionFromExtension = (actionToTrigger: IArticleAction) => {
                actionToTrigger.onTrigger();
            };

            const getActionsExtraFromExtensions = flatMap(
                Object.values(extensions).map((ext) => ext.activationResult),
                (activationResult) =>
                    activationResult.contributions &&
                    activationResult.contributions.entities &&
                    activationResult.contributions.entities.article &&
                    activationResult.contributions.entities.article.getActions
                        ? activationResult.contributions.entities.article.getActions
                        : [],
            );

            Promise.all(getActionsExtraFromExtensions.map((getPromise) => getPromise(scope.item)))
                .then((actions) => {
                    scope.extraActionsFromExtensions = flatMap(actions);
                });
        },
    };
}
