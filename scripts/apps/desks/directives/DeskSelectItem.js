
export function DeskSelectItem() {
    return {
        require: '^sdDeskSelect',
        link: function(scope, elem, attrs, ctrl) {
            // set focus on element when it gets active
            scope.$watch('ctrl.active._id', (activeId) => {
                if (activeId && activeId === scope.desk._id) {
                    elem.focus();
                }
            });

            // when it gets focus via tab key update controller
            elem.on('focus', () => {
                if (!scope.active || scope.active._id !== scope.desk._id) {
                    scope.$applyAsync(() => {
                        ctrl.setActive(scope.desk);
                    });
                }
            });

            if (scope.preferredDesks && scope.preferredDesks.selected[scope.desk._id] === true) {
                elem.addClass('preferred-desk');
            }
        },
    };
}
