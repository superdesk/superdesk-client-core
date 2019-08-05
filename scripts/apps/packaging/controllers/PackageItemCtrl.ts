import {gettext} from 'core/utils';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

PackageItemCtrl.$inject = ['data', 'packages', 'authoringWorkspace', 'notify'];
export function PackageItemCtrl(data, packages, authoringWorkspace: AuthoringWorkspaceService, notify) {
    packages.createPackageFromItems([data.item])
        .then((newPackage) => {
            authoringWorkspace.edit(newPackage);
        }, (response) => {
            if (response.status === 403 && response.data && response.data._message) {
                notify.error(gettext(response.data._message), 3000);
            }
        });
}
