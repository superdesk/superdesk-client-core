import {isEqual, keyBy} from 'lodash';
import {IArticle, IAuthoringFieldV2, IFieldAdapter, IPackageItem, IPackageItemsValueOperational} from 'superdesk-api';
import {gettext} from 'core/utils';
import {PACKAGE_ITEMS_FIELD_ID} from '../fields/package-items';

export const PACKAGE_ROOT_GROUP_ID = 'root';

interface IStoredRef {
    idRef?: string;
    label?: string | null;
}

interface IStoredGroup {
    id: string;
    role?: string;
    refs?: Array<IStoredRef>;
    [key: string]: unknown;
}

// A ref with `idRef` points to another group, the rest point to items.
function isGroupRef(ref: IStoredRef): boolean {
    return ref.idRef != null;
}

export function getPackageGroups(item: Partial<IArticle>): IPackageItemsValueOperational {
    const groups: Array<IStoredGroup> = item.groups ?? [];
    const root = groups.find(({id}) => id === PACKAGE_ROOT_GROUP_ID);

    if (root == null) {
        return [];
    }

    return (root.refs ?? []).filter(isGroupRef).map((rootRef) => {
        const group = groups.find(({id}) => id === rootRef.idRef);

        return {
            id: rootRef.idRef,
            label: rootRef.label,
            refs: (group?.refs ?? []).filter((ref) => !isGroupRef(ref)) as unknown as Array<IPackageItem>,
        };
    });
}

/**
 * The server replaces the whole `groups` array, so the root and every group are always written.
 * Only refs are rebuilt from the value, other properties of the root and of each group are kept.
 */
export function setPackageGroups(item: IArticle, value: IPackageItemsValueOperational): IArticle {
    if (isEqual(value, getPackageGroups(item))) {
        return item;
    }

    const groups: Array<IStoredGroup> = item.groups ?? [];
    const root = groups.find(({id}) => id === PACKAGE_ROOT_GROUP_ID);
    const rootRefs = keyBy((root?.refs ?? []).filter(isGroupRef), (ref) => ref.idRef);
    const valueGroups = keyBy(value, (group) => group.id);

    const nextRoot: IStoredGroup = {
        ...(root ?? {id: PACKAGE_ROOT_GROUP_ID, role: 'grpRole:NEP'}),
        refs: value.map((group) => rootRefs[group.id] ?? {idRef: group.id}),
    };

    const nextGroups: Array<IStoredGroup> = [];

    for (const group of groups) {
        if (group.id === PACKAGE_ROOT_GROUP_ID) {
            nextGroups.push(nextRoot);
        } else if (valueGroups[group.id] != null) {
            nextGroups.push({
                ...group,
                refs: [
                    ...valueGroups[group.id].refs,
                    ...(group.refs ?? []).filter(isGroupRef), // nested groups are not edited here
                ],
            });
        } else if (rootRefs[group.id] == null) {
            nextGroups.push(group); // not referenced from the root, so not part of the value
        }
    }

    if (root == null) {
        nextGroups.unshift(nextRoot);
    }

    const existingIds = new Set(groups.map(({id}) => id));

    for (const group of value) {
        if (!existingIds.has(group.id)) {
            nextGroups.push({id: group.id, role: 'grpRole:' + group.id, refs: group.refs});
        }
    }

    return {
        ...item,
        groups: nextGroups,
    };
}

export const package_items: IFieldAdapter<IArticle> = {
    getFieldV2: () => {
        const fieldV2: IAuthoringFieldV2 = {
            id: 'groups',
            name: gettext('Package items'),
            fieldType: PACKAGE_ITEMS_FIELD_ID,
            fieldConfig: {},
        };

        return fieldV2;
    },
    retrieveStoredValue: (item: IArticle): IPackageItemsValueOperational => getPackageGroups(item),
    storeValue: (value: IPackageItemsValueOperational, article: IArticle) => setPackageGroups(article, value),
};
