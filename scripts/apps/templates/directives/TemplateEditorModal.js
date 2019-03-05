import _ from 'lodash';

export function TemplateEditorModal() {
    return {
        templateUrl: 'scripts/apps/templates/views/template-editor-modal.html',
        link: function(scope) {
            _.defer(() => {
                const ENTER = 13;

                let modalBodyContainer = angular.element('.modal__body');

                function handleKeyDown(event) {
                    if (event.keyCode === ENTER && event.target.tagName === 'INPUT') {
                        event.preventDefault();
                    }
                }

                scope.$watch('template.schedule.day_of_week', (newValue, oldValue) => {
                    if (newValue && newValue.length > 0 && !_.isEqual(newValue, oldValue)) {
                        modalBodyContainer.scope().metadataForm.$setDirty();
                    }
                }, true);

                modalBodyContainer.on('keydown', handleKeyDown);

                scope.$on('$destroy', () => {
                    modalBodyContainer.off('keydown', handleKeyDown);
                });

                let _isDirty;

                /**
                 * Set dirty on autosave - it is called on change
                 */
                scope.autosave = () => {
                    _isDirty = true;
                };

                /**
                 * Test if scope is dirty
                 */
                scope.isDirty = (templateForm, metadataForm) => templateForm.$dirty || metadataForm.$dirty || _isDirty;
            });
        },
    };
}
