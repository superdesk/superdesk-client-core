import {ITreeNode} from 'superdesk-api';

/**
 * 1. Initialize flat tree from `itemsFlat` (ITreeNode interface without parents or children set)
 * 2. Iterate itemsFlat
 * 3. If parent id is present, find corresponding tree nodes for self and parent.
 * 4. Set parent object to self, and push a child to the parent.
 * 5. Filter the tree nodes so only root items are returned.
 */
export function arrayToTree<T>(
    itemsFlat: Array<T>,
    getId: (item: T) => string,
    getParentId: (item: T) => string | undefined | null,
): Array<ITreeNode<T>> {
    const initialTree = itemsFlat.reduce<{[key: string]: ITreeNode<T>}>((acc, item) => {
        const id = getId(item);

        acc[id] = {value: item};

        return acc;
    }, {});

    for (const itemFlat of itemsFlat) {
        const item = initialTree[getId(itemFlat)];
        const parentId = getParentId(itemFlat);

        if (parentId != null) {
            const parent = initialTree[parentId];

            item.parent = parent;

            if (parent.children == null) {
                parent.children = [];
            }

            parent.children.push(item);

            initialTree[parentId] = parent;
        }
    }

    return Object.values(initialTree).filter((item) => item.parent == null);
}

export function treeToArray<T>(tree: Array<ITreeNode<T>>): Array<T> {
    const items: Array<T> = [];

    for (const node of tree) {
        items.push(node.value);

        if (node.children != null) {
            items.push(...treeToArray(node.children));
        }
    }

    return items;
}
