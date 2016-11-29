CreatePackageCtrl.$inject = ['data', 'packages', 'authoringWorkspace'];
export function CreatePackageCtrl(data, packages, authoringWorkspace) {
    function edit(item) {
        authoringWorkspace.edit(item);
    }
    if (data && data.items) {
        packages.createPackageFromItems(data.items, data.defaults).then(edit);
    } else {
        var defaultData = data && data.defaults ? data.defaults : {};

        packages.createEmptyPackage(defaultData).then(edit);
    }
}
