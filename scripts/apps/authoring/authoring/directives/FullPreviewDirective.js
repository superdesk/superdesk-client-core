FullPreviewDirective.$inject = ['api', '$timeout', 'config', 'content', '$sce'];
export function FullPreviewDirective(api, $timeout, config, content, $sce) {
    return {
        scope: {
            item: '=',
            closeAction: '='
        },
        templateUrl: 'scripts/apps/authoring/views/full-preview.html',
        link: function(scope, elem, attr, ctrl) {
            scope.hide_images = false;

            scope.filterKey = config.previewSubjectFilterKey || '';

            if (scope.item.profile) {
                content.getType(scope.item.profile)
                    .then((type) => {
                        scope.editor = content.editor(type);
                        scope.fields = content.fields(type);
                    });
            } else {
                scope.editor = content.editor();
            }

            scope.getHtml = function(html) {
                return $sce.trustAsHtml(html);
            };

            scope.printPreview = function() {
                angular.element('body').addClass('prepare-print');

                var afterPrint = function() {
                    angular.element('body').removeClass('prepare-print');
                };

                if (window.matchMedia) {
                    var mediaQueryList = window.matchMedia('print');

                    mediaQueryList.addListener((mql) => {
                        if (!mql.matches) {
                            afterPrint();
                        }
                    });
                }

                window.onafterprint = afterPrint;

                $timeout(() => {
                    window.print();
                }, 200, false);
                return false;
            };
        }
    };
}
