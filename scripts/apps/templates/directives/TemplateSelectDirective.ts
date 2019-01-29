import {gettext} from 'core/ui/components/utils';

TemplateSelectDirective.$inject = ['api', 'desks', 'session', 'templates', 'notify'];
export function TemplateSelectDirective(api, desks, session, templates, notify) {
    var PAGE_SIZE = 200;

    return {
        templateUrl: 'scripts/apps/templates/views/sd-template-select.html',
        scope: {
            selectAction: '=',
            open: '=',
        },
        link: function(scope) {
            scope.options = {
                templateName: null,
            };

            scope.close = function() {
                scope.open = false;
            };

            scope.select = function(template) {
                scope.selectAction(template);
                scope.close();
            };

            scope.loading = false;

            /**
             * Fetch templates and assign it to scope but split it into public/private
             */
            function fetchTemplates() {
                scope.loading = true;

                templates.fetchTemplatesByUserDesk(session.identity._id, desks.getCurrentDeskId(),
                    scope.options.page, PAGE_SIZE, 'create', scope.options.templateName)
                    .then((result) => {
                        scope.loading = false;
                        if (result._items.length === 0) {
                            notify.error(gettext('No Templates found.'));
                        } else {
                            scope.open = true;
                            scope.publicTemplates = [];
                            scope.privateTemplates = [];
                            result._items.forEach((template) => {
                                if (template.is_public !== false) {
                                    scope.publicTemplates.push(template);
                                } else {
                                    scope.privateTemplates.push(template);
                                }
                            });
                        }
                    });
            }

            scope.$watch('options.templateName', fetchTemplates);
        },
    };
}
