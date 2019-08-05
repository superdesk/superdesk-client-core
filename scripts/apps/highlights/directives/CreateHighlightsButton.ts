import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

CreateHighlightsButton.$inject = ['highlightsService', 'authoringWorkspace', 'privileges'];
export function CreateHighlightsButton(highlightsService, authoringWorkspace: AuthoringWorkspaceService, privileges) {
    return {
        scope: {highlight_id: '=highlight'},
        templateUrl: 'scripts/apps/highlights/views/create_highlights_button_directive.html',
        link: function(scope) {
            /**
             * Create new highlight package for current highlight and start editing it
             */
            scope.createHighlight = function() {
                highlightsService.find(scope.highlight_id)
                    .then(highlightsService.createEmptyHighlight)
                    .then(authoringWorkspace.edit);
            };

            scope.hasMarkItemPrivilege = privileges.privileges.mark_for_highlights;
        },
    };
}
