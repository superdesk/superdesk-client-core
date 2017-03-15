
ContentFilterSelectDirective.$inject = ['contentFilters'];
export function ContentFilterSelectDirective(contentFilters) {
    return {
        scope: {model: '='},
        template: require('../views/content-filter-select.html'),
        link: (scope) => {
            contentFilters.getAllContentFilters(1, [])
                .then((filters) => {
                    scope.filters = filters;
                });
        }
    };
}
