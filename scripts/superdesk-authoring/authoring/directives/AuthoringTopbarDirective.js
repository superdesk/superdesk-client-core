AuthoringTopbarDirective.$inject = [];
export function AuthoringTopbarDirective() {
    return {
        templateUrl: 'scripts/superdesk-authoring/views/authoring-topbar.html',
        link: function(scope) {
            scope.saveDisabled = false;
            scope.saveTopbar = function() {
                scope.saveDisabled = true;
                return scope.save(scope.item)
                ['finally'](function() {
                    scope.saveDisabled = false;
                });
            };

            scope.previewFormattedItem = function() {
                scope.previewFormatted = true;
            };

            scope.closePreviewFormatted = function() {
                scope.previewFormatted = false;
            };
        }
    };
}
