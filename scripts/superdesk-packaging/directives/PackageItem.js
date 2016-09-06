export function PackageItem() {
    return {
        templateUrl: 'scripts/superdesk-packaging/views/sd-package-item.html',
        scope: {
            id: '=',
            item: '=',
            setitem: '&',
            mode: '='
        },
        link: function(scope, elem) {
        }
    };
}
