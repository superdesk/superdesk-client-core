import React from 'react';
import PackageGroupList from '../components/PackageGroupList';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IPackagesService} from 'types/Services/Packages';

AddToPackageDropdown.$inject = ['item', 'className', 'authoringWorkspace', 'packages', 'api'];
export function AddToPackageDropdown(
    item,
    className,
    authoringWorkspace: AuthoringWorkspaceService,
    packages: IPackagesService,
    api,
) {
    return React.createElement(PackageGroupList, {
        item: item,
        package: authoringWorkspace.getItem(),
        api: api,
        packages: packages,
        className: className,
    });
}
