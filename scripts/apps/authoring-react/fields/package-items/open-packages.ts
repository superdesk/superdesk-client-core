import {IArticle, IPackageItemsValueOperational} from 'superdesk-api';

/**
 * Groups of the packages open in authoring-react, unsaved changes included. Angular's "Add to current"
 * and "Set label" checks read these, because angular's copy of the item is the one loaded on open.
 */
const openPackages = new Map<IArticle['_id'], IPackageItemsValueOperational>();

export function setOpenPackageGroups(packageId: IArticle['_id'], groups: IPackageItemsValueOperational): void {
    openPackages.set(packageId, groups);
}

export function removeOpenPackageGroups(packageId: IArticle['_id']): void {
    openPackages.delete(packageId);
}

export function getOpenPackageGroups(packageId: IArticle['_id']): IPackageItemsValueOperational | null {
    return openPackages.get(packageId) ?? null;
}
