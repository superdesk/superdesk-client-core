import {gettext} from 'core/utils';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IPackagesService} from 'types/Services/Packages';

CombinePackageCtrl.$inject = ['data', 'packages', 'authoringWorkspace', 'notify'];
export function CombinePackageCtrl(
    data,
    packages: IPackagesService,
    authoringWorkspace: AuthoringWorkspaceService,
    notify,
) {
    var openItem = authoringWorkspace.getItem();

    packages.createPackageFromItems([openItem, data.item])
        .then((newPackage) => {
            authoringWorkspace.edit(newPackage);
        }, (response) => {
            if (response.status === 403 && response.data && response.data._message) {
                notify.error(gettext(response.data._message), 3000);
            }
        });
}
