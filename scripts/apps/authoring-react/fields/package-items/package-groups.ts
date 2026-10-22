import {IArticle, IPackageItem, IPackageItemsValueOperational} from 'superdesk-api';

export interface IPackageItemPosition {
    groupId: string;
    index: number;
}

/**
 * Search results from other repositories carry the id of the record in that repository,
 * which is not always the id the server resolves `residRef` against.
 */
function getResidRefAndLocation(item: IArticle): {residRef: string; location: string} {
    if (item._type === 'ingest') {
        return {residRef: item._id, location: 'ingest'};
    } else if (item._type === 'published' && item.item_id != null) {
        return {residRef: item.item_id, location: 'archive'};
    } else {
        return {residRef: item._id, location: 'archive'};
    }
}

export function getPackageItemRef(item: IArticle): IPackageItem {
    return {
        ...getResidRefAndLocation(item),
        type: item.type ?? '',
        headline: item.headline ?? '',
        slugline: item.slugline ?? '',
        renditions: item.renditions ?? {},
        itemClass: item.type ? 'icls:' + item.type : '',
    } as IPackageItem;
}

export function isInPackage(groups: IPackageItemsValueOperational, item: IArticle): boolean {
    const {residRef} = getResidRefAndLocation(item);

    return groups.some(
        (group) => group.refs.some((ref) => ref.residRef === residRef || ref.residRef === item._id),
    );
}

/**
 * Items are put in front of the group one by one, like angular does. A group the package
 * does not have yet is added at the end.
 */
export function addItemsToGroup(
    groups: IPackageItemsValueOperational,
    groupId: string,
    items: Array<IArticle>,
): {groups: IPackageItemsValueOperational; duplicates: Array<IArticle>} {
    const duplicates: Array<IArticle> = [];
    let next = groups.some(({id}) => id === groupId) ? groups : [...groups, {id: groupId, refs: []}];

    for (const item of items) {
        if (isInPackage(next, item)) {
            duplicates.push(item);
        } else {
            next = next.map((group) => group.id === groupId
                ? {...group, refs: [getPackageItemRef(item), ...group.refs]}
                : group,
            );
        }
    }

    return {groups: next, duplicates};
}

export function removeItem(groups: IPackageItemsValueOperational, groupId: string, residRef: string) {
    return groups.map((group) => group.id === groupId
        ? {...group, refs: group.refs.filter((ref) => ref.residRef !== residRef)}
        : group,
    );
}

export function moveItem(
    groups: IPackageItemsValueOperational,
    source: IPackageItemPosition,
    destination: IPackageItemPosition,
): IPackageItemsValueOperational {
    if (source.groupId === destination.groupId && source.index === destination.index) {
        return groups;
    }

    const sourceGroup = groups.find(({id}) => id === source.groupId);
    const moved = sourceGroup?.refs[source.index];

    if (moved == null || !groups.some(({id}) => id === destination.groupId)) {
        return groups;
    }

    const withoutMoved = groups.map((group) => group.id === source.groupId
        ? {...group, refs: group.refs.filter((_, i) => i !== source.index)}
        : group,
    );

    return withoutMoved.map((group) => {
        if (group.id !== destination.groupId) {
            return group;
        }

        const refs = [...group.refs];

        refs.splice(destination.index, 0, moved);

        return {...group, refs};
    });
}

export function setItemLabel(
    groups: IPackageItemsValueOperational,
    residRef: string,
    label: string | null,
): IPackageItemsValueOperational {
    return groups.map((group) => group.refs.some((ref) => ref.residRef === residRef)
        ? {...group, refs: group.refs.map((ref) => ref.residRef === residRef ? {...ref, label} : ref)}
        : group,
    );
}
