/* eslint-disable react/no-multi-comp */
import React, {useEffect, useState} from 'react';
import {useVirtual} from 'react-virtual';
import {Map} from 'immutable';

import {gettext} from 'core/utils';
import {Alert} from 'superdesk-ui-framework/react';

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
    getId(item: T): string; // needed for finding index of item that needs to be reloaded. See `IExposedFromVirtualList`
    itemTemplate: React.ComponentType<{item: T}>;
    noItemsTemplate?: React.ComponentType;
}

export interface IExposedFromVirtualList {
    /**
     * Will not unmount the component.
     * Will keep scroll position.
     * Will not display visual indicators that reloading is taking place.
     */
    reloadAll(): void;

    /**
     * Optimized to reload only if item is visible in viewport(or preloaded)
     */
    reloadItem(id: string): void;
}

function VirtualListComponent<T>(props: IProps<T>, ref: React.Ref<IExposedFromVirtualList>) {
    const {totalItemsCount, loadItems, itemTemplate, width, height, initialItems} = props;
    const parentRef = React.useRef();

    const rowVirtualizer = useVirtual({
        size: totalItemsCount,
        parentRef,
    });

    const [items, setItems] = useState(initialItems ?? Map<number, T>());
    const [loadingInProgress, setLoadingInProgress] = useState(false);

    function doLoadItems(currentItems: Map<number, T>, from: number, to: number) {
        setLoadingInProgress(true);

        loadItems(from, to).then((loadedItems) => {
            setItems(currentItems.merge(loadedItems));
            setTimeout(() => {
                setLoadingInProgress(false);
            });
        });
    }

    function loadMore(
        /**
         * A Parameter is accepted to support {@link IExposedFromVirtualList.reloadAll}
         * Otherwise {@link items} that are already in scope could be used.
         */
        currentItems: Map<number, T>,
    ) {
        let viewportIndexStart = rowVirtualizer.virtualItems.length < 1
            ? 0
            : rowVirtualizer.virtualItems[0].index;

        let viewportIndexEnd = rowVirtualizer.virtualItems.length < 1
            ? 0
            : viewportIndexStart + rowVirtualizer.virtualItems.length;

        const visibleItemsCount = viewportIndexEnd - viewportIndexStart;

        const itemsToLoad: {
            from: number;
            to: number;
        } = (() => {
            if (rowVirtualizer.virtualItems.length < 1) {
                return {from: 0, to: minBatchSize};
            } else {
                return getItemsToLoad(
                    currentItems,
                    totalItemsCount,
                    viewportIndexStart,
                    viewportIndexEnd,
                );
            }
        })();

        if (itemsToLoad != null) {
            doLoadItems(currentItems, itemsToLoad.from, itemsToLoad.to);
        } else {
            // Avoid memory leaks - only store a fixed number of items in memory
            const needsToFreeMemory = currentItems.size > visibleItemsCount * ((pagesToCache * 2) + 1);

            if (needsToFreeMemory) {
                let result = Map<number, T>();

                const cacheFrom = Math.max(0, viewportIndexStart - (visibleItemsCount * pagesToCache));
                const cacheTo = Math.min(totalItemsCount, viewportIndexEnd + (visibleItemsCount * pagesToCache));

                for (let j = cacheFrom; j < cacheTo; j++) {
                    result = result.set(j, currentItems.get(j));
                }

                setItems(result);
            }
        }
    }

    React.useImperativeHandle(ref, () => {
        var exposed: IExposedFromVirtualList = {
            reloadAll: () => {
                loadMore(Map<number, T>());
            },
            reloadItem: (id) => {
                const entry = items.findEntry((item) => props.getId(item) === id) as [number, T] | undefined;

                if (entry != null) { // null when isn't present in cache (thus also not displayed)
                    const index = entry[0];

                    // IMPROVE: reloading by index is error-prone. Consider reimplementing to reload by ID.
                    doLoadItems(items, index, index + 1);
                }
            },
        };

        return exposed;
    });

    useEffect(() => {
        if (!loadingInProgress && props.totalItemsCount > 0) {
            loadMore(items);
        }
    });

    if (props.totalItemsCount < 1) {
        const defaultTemplate: React.ComponentType = () => (
            <div style={{padding: 8}}>
                <Alert size="small">{gettext('There are no items yet')}</Alert>
            </div>
        );

        const NoItemsTemplate = props.noItemsTemplate ?? defaultTemplate;

        return (
            <NoItemsTemplate />
        );
    }

    return (
        <div
            ref={parentRef}
            style={{
                maxHeight: `${height}px`,
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
                                    insetBlockStart: 0,
                                    insetInlineStart: 0,
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

export const VirtualList = React.forwardRef(VirtualListComponent);
