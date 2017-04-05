export function TemplateEditorModal() {
    return {
        templateUrl: 'scripts/apps/templates/views/template-editor-modal.html',
        link: function(scope) {
            _.defer(() => {
                const ENTER = 13;

                let modalBodyContainer = angular.element('.modal-body');

                function handleKeyDown(event) {
                    if (event.keyCode === ENTER && event.target.tagName === 'INPUT') {
                        event.preventDefault();
                    }
                }

                modalBodyContainer.on('keydown', handleKeyDown);

                scope.$on('$destroy', () => {
                    modalBodyContainer.off('keydown', handleKeyDown);
                });
            });
        }
    };
}
