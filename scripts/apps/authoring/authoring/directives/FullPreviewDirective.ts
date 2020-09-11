import _ from 'lodash';

FullPreviewDirective.$inject = ['$timeout', 'content', '$sce'];
export function FullPreviewDirective($timeout, content, $sce) {
    return {
        scope: {
            items: '=',
            closeAction: '=',
        },
        templateUrl: 'scripts/apps/authoring/views/full-preview.html',
        link: function(scope, elem, attr, ctrl) {
            scope.hideMedia = false;

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
        },
    };
}
