export interface IPackagesService {
    groupList: Array<string>;
    packageGroupItems: any;

    fetch(_id): any;
    open(_id, readOnly): any;
    createPackageFromItems(items, defaults?): any;
    createEmptyPackage(defaults?: any, initializeAsUpdated?: boolean, idRef?, label?): any;
    addItemsToPackage(current, groupId, items): any;
    isAdded(pkg, item): any;
    fetchItem(packageItem): any;
    getReferenceFor(item): any;
    isSetItemLabel(item, label): any;
    addPackageGroupItem(group, item, broadcast): any;
    removePackageGroupItem(group, item);
    isAddedToPackage(pkg, item): any;
}
