import React from 'react';
import PackageGroupList from '../components/PackageGroupList';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';

AddToPackageDropdown.$inject = ['item', 'className', 'authoringWorkspace', 'packages', 'api'];
export function AddToPackageDropdown(item, className, authoringWorkspace: AuthoringWorkspaceService, packages, api) {
    return React.createElement(PackageGroupList, {
        item: item,
        package: authoringWorkspace.getItem(),
        api: api,
        packages: packages,
        className: className,
    });
}
