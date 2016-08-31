HtmlPreview.$inject = ['$sce'];

export function HtmlPreview($sce) {
    return {
        scope: {sdHtmlPreview: '='},
        template: '<div ng-bind-html="html"></div>',
        link: function(scope, elem, attrs) {
            scope.$watch('sdHtmlPreview', function(html) {
                scope.html = $sce.trustAsHtml(html);
            });
        }
    };
}
