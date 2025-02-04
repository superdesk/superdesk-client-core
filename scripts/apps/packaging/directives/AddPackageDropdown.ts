import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IPackagesService} from 'types/Services/Packages';

AddPackageDropdown.$inject = ['$rootScope', 'api', 'packages', 'authoringWorkspace'];
export function AddPackageDropdown(
    $rootScope,
    api,
    packages: IPackagesService,
    authoringWorkspace: AuthoringWorkspaceService,
) {
    return {
        templateUrl: 'scripts/apps/packaging/views/sd-add-package-dropdown.html',
        link: function(scope) {
            var pkg = authoringWorkspace.getItem();

            scope.groupList = null;
            if (pkg.highlight) {
                api('highlights').getById(pkg.highlight)
                    .then((result) => {
                        scope.groupList = result.groups;
                    });
            }
            scope.groupList = scope.groupList || packages.groupList;

            scope.select = function(group) {
                packages.addPackageGroupItem(group, scope.item, null);
            };
        },
    };
}
