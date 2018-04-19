HtmlPreview.$inject = ['$sce'];

export function HtmlPreview($sce) {
    return {
        scope: {sdHtmlPreview: '='},
        template: '<div ng-bind-html="html"></div>',
        link: function(scope, elem, attrs) {
            scope.$watch('sdHtmlPreview', (html) => {
                scope.html = $sce.trustAsHtml(html);
                if (window.hasOwnProperty('instgrm')) {
                    window.instgrm.Embeds.process();
                }
            });
        },
    };
}
