import React, {useEffect, useState} from 'react';
import {useVirtual} from 'react-virtual';
import {Map} from 'immutable';

import {gettext} from 'core/utils';
import {noop} from 'lodash';

/**
 * TERMS:
 *
 * A PAGE is a number of items that are visible in the viewport of virtual list.
 */

const pagesToPreload: number = 2;
const pagesToCache: number = pagesToPreload * 4; // (must be greater than pagesToPreload)
const minBatchSize = 50;

function getItemsToLoad<T>(
    loadedItems: Map<number, T>,
    totalItemsCount: number,
    viewportIndexStart: number,
    viewportIndexEnd: number,
): null | {from: number; to: number} {
    const visibleItemsCount = viewportIndexEnd - viewportIndexStart;

    let from = viewportIndexStart;

    // include items that should be pre-loaded
    from = Math.max(0, from - (visibleItemsCount * pagesToPreload));

    // exclude items that are already loaded
    for (let i = from; i <= totalItemsCount - 1; i++) {
        if (loadedItems.get(i) == null) {
            break;
        } else {
            from = i;
        }
    }

    //

    let to = viewportIndexEnd;

    // include items that should be pre-loaded
    to = Math.min(totalItemsCount, to + (visibleItemsCount * pagesToPreload));

    // exclude items that are already loaded
    for (let i = to - 1; i >= from; i--) {
        if (loadedItems.get(i) == null) {
            break;
        } else {
            to = i;
        }
    }

    if (from >= to) {
        return null;
    }

    const estimatedItemCountToLoad = to - from;

    // enforce minimum batch size
    if (estimatedItemCountToLoad < minBatchSize) {
        if (loadedItems.get(from - 1) != null) { // loading next items
            to = Math.min(totalItemsCount, to + (minBatchSize - estimatedItemCountToLoad));
        } else if (loadedItems.get(to + 1) != null) { // loading previous items
            from = Math.max(0, from - (minBatchSize - estimatedItemCountToLoad));
        }
    }

    return {from, to};
}

interface IProps<T> {
    width: number;
    height: number;
    totalItemsCount: number;
    initialItems?: Map<number, T>;
    loadItems(from: number, to: number): Promise<Map<number, T>>;
    itemTemplate: React.ComponentType<{item: T}>;
}

export function VirtualList<T>(props: IProps<T>) {
    const {totalItemsCount, loadItems, itemTemplate, width, height, initialItems} = props;
    const parentRef = React.useRef();

    const rowVirtualizer = useVirtual({
        size: totalItemsCount,
        parentRef,
    });

    if (rowVirtualizer.virtualItems.length < 1) {
        return null;
    }

    const [items, setItems] = useState(initialItems ?? Map<number, T>());
    const [loadingInProgress, setLoadingInProgress] = useState(false);

    useEffect(() => {
        if (loadingInProgress) {
            return noop;
        }

        let viewportIndexStart = rowVirtualizer.virtualItems[0].index;
        let viewportIndexEnd = viewportIndexStart + rowVirtualizer.virtualItems.length;
        const visibleItemsCount = viewportIndexEnd - viewportIndexStart;

        const itemsToLoad = getItemsToLoad(
            items,
            totalItemsCount,
            viewportIndexStart,
            viewportIndexEnd,
        );

        if (itemsToLoad != null) {
            setLoadingInProgress(true);

            loadItems(itemsToLoad.from, itemsToLoad.to).then((more) => {
                setItems(items.merge(more));
                setTimeout(() => {
                    setLoadingInProgress(false);
                });
            });
        } else {
            // Avoid memory leaks - only store a fixed number of items in memory
            const needsToFreeMemory = items.size > visibleItemsCount * ((pagesToCache * 2) + 1);

            if (needsToFreeMemory) {
                let result = Map<number, T>();

                const cacheFrom = Math.max(0, viewportIndexStart - (visibleItemsCount * pagesToCache));
                const cacheTo = Math.min(totalItemsCount, viewportIndexEnd + (visibleItemsCount * pagesToCache));

                for (let j = cacheFrom; j < cacheTo; j++) {
                    result = result.set(j, items.get(j));
                }

                setItems(result);
            }
        }
    });

    return (
        <div
            ref={parentRef}
            className="List"
            style={{
                height: `${height}px`,
                width: `${width}px`,
                overflow: 'auto',
            }}
        >
            <div
                style={{
                    height: rowVirtualizer.totalSize,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {
                    rowVirtualizer.virtualItems.map((virtualRow) => {
                        const item = items.get(virtualRow.index) as T;
                        const Template = itemTemplate;

                        return (
                            <div
                                key={virtualRow.index}
                                ref={(el) => {
                                    virtualRow.measureRef(el);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                {
                                    item == null
                                        ? (
                                            <div style={{textAlign: 'center'}}>{gettext('loading...')}</div>
                                        )
                                        : (
                                            <Template item={item} />
                                        )
                                }
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}
