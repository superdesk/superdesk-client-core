export function PackageItem() {
    return {
        templateUrl: 'scripts/apps/packaging/views/sd-package-item.html',
        scope: {
            id: '=',
            item: '=',
            setitem: '&',
            mode: '=',
        },
    };
}
