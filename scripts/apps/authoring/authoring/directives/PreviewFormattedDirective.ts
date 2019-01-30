import {gettext} from 'core/ui/components/utils';

PreviewFormattedDirective.$inject = ['api', 'config', 'notify', 'storage'];
export function PreviewFormattedDirective(api, config, notify, storage) {
    return {
        templateUrl: 'scripts/apps/authoring/views/preview-formatted.html',
        link: function(scope) {
            scope.loading = false;
            scope.selectedFormatter = storage.getItem('selectedFormatter');

            scope.format = function(formatterString) {
                scope.loading = true;
                storage.setItem('selectedFormatter', formatterString);
                var formatter = JSON.parse(formatterString);

                api.save('formatters', {}, {article_id: scope.item._id, formatter_name: formatter.name})
                    .then((item) => {
                        scope.formattedItem = item._id.formatted_doc;
                    }, (error) => {
                        if (angular.isDefined(error.data._message)) {
                            notify.error(gettext(error.data._message));
                        }
                    })
                    .finally(() => {
                        scope.loading = false;
                    });
            };

            // Get formatters
            api.query('formatters', {criteria: 'can_preview'}).then((result) => {
                scope.previewFormatters = result._items;
                if (!scope.selectedFormatter && scope.previewFormatters.length > 0) {
                    scope.selectedFormatter = JSON.stringify(scope.previewFormatters[0]);
                }
            });
        },
    };
}
