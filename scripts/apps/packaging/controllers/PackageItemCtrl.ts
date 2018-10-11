PackageItemCtrl.$inject = ['data', 'packages', 'authoringWorkspace', 'notify', 'gettext'];
export function PackageItemCtrl(data, packages, authoringWorkspace, notify, gettext) {
    packages.createPackageFromItems([data.item])
        .then((newPackage) => {
            authoringWorkspace.edit(newPackage);
        }, (response) => {
            if (response.status === 403 && response.data && response.data._message) {
                notify.error(gettext(response.data._message), 3000);
            }
        });
}
