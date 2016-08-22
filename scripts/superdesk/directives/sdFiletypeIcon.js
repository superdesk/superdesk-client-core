export default angular.module('superdesk.directives.filetypeIcon', [])
.directive('sdFiletypeIcon', function() {
    return {
        scope: {item: '='},
        link: function(scope, element, attrs) {
            scope.$watch('item', function(item) {
                if (item) {
                    initIcon(item);
                }
            }, true);

            function initIcon(item) {
                console.log(item, element);
                var cls = 'filetype-icon-';
                if (item.package_type) {
                    cls += 'takes-pack';
                } else if (item.type === 'composite' && item.highlight) {
                    cls += 'highlight-pack';
                } else {
                    cls += item.type;
                }
                element.addClass(cls);
            }
        }
    };
});
console.log('sdFiletypeIcon');
