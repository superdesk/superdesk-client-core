import React from 'react';
import PackageGroupList from '../components/PackageGroupList';

AddToPackageDropdown.$inject = ['item', 'className', 'authoringWorkspace', 'packages', 'api', '$rootScope'];
export function AddToPackageDropdown(item, className, authoringWorkspace, packages, api, $rootScope) {
    return React.createElement(PackageGroupList, {
        item: item,
        package: authoringWorkspace.getItem(),
        api: api,
        packages: packages,
        className: className,
    });
}
