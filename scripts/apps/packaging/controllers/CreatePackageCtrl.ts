import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IPackagesService} from 'types/Services/Packages';

CreatePackageCtrl.$inject = ['data', 'packages', 'authoringWorkspace'];
export function CreatePackageCtrl(data, packages: IPackagesService, authoringWorkspace: AuthoringWorkspaceService) {
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
