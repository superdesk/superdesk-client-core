import React from 'react';
import {gettext} from 'core/utils';
import {OrderedMap} from 'immutable';

interface IProps<T> {
    pageSize: number;
    itemCount: number;
    padding?: string;
    getItemsByIds(ids: Array<string>): Promise<OrderedMap<string, T>>;
    loadMoreItems(from: number, to: number): Promise<OrderedMap<string, T>>;
    children: (items: OrderedMap<string, T>) => JSX.Element;
    'data-test-id'?: string;
}

interface IState<T> {
    items: OrderedMap<string, T>; // id, entity
    loading: boolean;
}

const messageStyles: React.CSSProperties = {
    padding: 20,
    textAlign: 'center',
    backgroundColor: 'transparent',
    borderTop: '1px solid transparent',
};

function hasScrollbar(element: Element) {
    return element.clientHeight < element.scrollHeight;
}

export class LazyLoader<T> extends React.Component<IProps<T>, IState<T>> {
    private containerRef: any;
    private _mounted: boolean;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            items: OrderedMap(),
            loading: true,
        };

        this.loadMore = this.loadMore.bind(this);
        this.allItemsLoaded = this.allItemsLoaded.bind(this);
        this.getLoadedItemsCount = this.getLoadedItemsCount.bind(this);

        this.reset = this.reset.bind(this);
        this.reloadAllItems = this.reloadAllItems.bind(this);
        this.updateItems = this.updateItems.bind(this);
    }

    public updateItems(ids: Set<string>): void {
        const {items} = this.state;
        const onlyLoadedIds = Array.from(ids).filter((id) => items.has(id));

        this.props.getItemsByIds(onlyLoadedIds).then((updates) => {
            this.setState({
                items: items.merge(updates),
            });
        });
    }

    private reloadAllItems() {
        const MAX_PAGE_SIZE = 200; // back-end limit

        const loadedItemsCount = this.state.items.size;

        const pages = loadedItemsCount > 0 ?
            new Array(Math.ceil(loadedItemsCount / MAX_PAGE_SIZE)).fill(null).map((_, i) => {
                const to = (i + 1) * MAX_PAGE_SIZE;
                const to_limited = Math.min(to, loadedItemsCount);
                const from = to - MAX_PAGE_SIZE;

                return {from: from, to: to_limited};
            }) : (
                [{from: this.state.items.size, to: this.state.items.size + this.props.pageSize}]
            );

        if (this._mounted) {
            this.setState({
                loading: true,
            }, () => {
                Promise.all(
                    pages.map(({from, to}) => this.props.loadMoreItems(from, to)),
                ).then((res) => {
                    this.setState({
                        items: res.reduce((acc, item) => acc.merge(item)),
                        loading: false,
                    });
                });
            });
        }
    }

    public reset(): void {
        this.reloadAllItems();
    }

    private loadMore() {
        this.setState({loading: true});

        const {items} = this.state;
        const from = items.size;
        const to = from + this.props.pageSize;

        this.props.loadMoreItems(from, to).then((moreItems) => {
            this.setState({
                items: items.merge(moreItems),
                loading: false,
            });
        });
    }

    private allItemsLoaded() {
        const {items} = this.state;
        const from = items.size;
        const loadedCount = items.size;

        return Math.max(from, loadedCount) >= this.props.itemCount;
    }

    private getLoadedItemsCount() {
        return this.state.items.size;
    }

    componentDidMount() {
        this._mounted = true;

        this.loadMore();
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    componentDidUpdate(prevProps: IProps<T>, prevState: IState<T>) {
        if (!this.state.loading && this.state.items !== prevState.items) {
            // Ensure there are enough items for the scrollbar to appear.
            // Lazy loading wouldn't work otherwise because it depends on "scroll" event firing.
            if (hasScrollbar(this.containerRef) !== true && this.allItemsLoaded() !== true) {
                this.loadMore();
            }
        }
    }

    render() {
        const {loading, items} = this.state;

        return (
            <div
                style={{display: 'flex', flexDirection: 'column', maxHeight: '100%', position: 'relative'}}
                data-test-id={this.props['data-test-id']}
            >
                <div
                    style={{
                        maxHeight: '100%',
                        overflow: 'auto',
                        flexGrow: 1,
                        padding: this.props.padding ?? '0',
                    }}
                    onScroll={(event) => {
                        if (loading || this.allItemsLoaded()) {
                            return;
                        }

                        const {scrollHeight, offsetHeight, scrollTop} = (event.target as any);
                        const reachedBottom = scrollHeight === Math.round(offsetHeight + scrollTop);

                        if (reachedBottom) {
                            this.loadMore();
                        }
                    }}
                    ref={(el) => {
                        this.containerRef = el;
                    }}
                >
                    {this.getLoadedItemsCount() === 0 ? null : this.props.children(items)}
                    {(() => {
                        const loaderPosition: React.CSSProperties = this.getLoadedItemsCount() > 0
                            ? {
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                            }
                            : {};

                        if (loading === true) {
                            return (
                                <div style={{position: 'relative', width: '100%'}}>
                                    <div style={loaderPosition}>
                                        <div style={messageStyles} data-test-id="loading">{gettext('Loading...')}</div>
                                    </div>
                                </div>
                            );
                        } else if (this.allItemsLoaded()) {
                            if (this.getLoadedItemsCount() === 0) {
                                return (
                                    <div style={messageStyles}>{gettext('There are currently no items.')}</div>
                                );
                            } else {
                                return (
                                    <div style={messageStyles}>{gettext('All items have been loaded.')}</div>
                                );
                            }
                        } else {
                            return null;
                        }
                    })()}
                </div>
            </div>
        );
    }
}
