export function TemplateListDirective() {
    var ENTER = 13;

    return {
        scope: {templates: '=', select: '&'},
        templateUrl: 'scripts/apps/templates/views/template-list.html',
        link: function(scope) {
            /**
             * Call select on keyboard event if key was enter
             *
             * @param {Event} $event
             * @param {Object} template
             */
            scope.selectOnEnter = function($event, template) {
                if ($event.key === ENTER) {
                    scope.select(template);
                }
            };
        },
    };
}
