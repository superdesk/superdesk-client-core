import React from 'react';
import {Map} from 'immutable';
import {debounce, omit} from 'lodash';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {IBaseRestApiResponse, IPropsVirtualListFromQuery, IRestApiResponse, ISuperdeskQuery} from 'superdesk-api';
import {getPaginationInfo} from 'core/helpers/pagination';
import {prepareSuperdeskQuery} from 'core/helpers/universal-query';
import {IExposedFromVirtualList, VirtualList} from './virtual-list';
import {SmoothLoaderForKey} from 'apps/search/components/SmoothLoaderForKey';
import {nameof} from 'core/helpers/typescript-helpers';
import {addWebsocketEventListener} from 'core/notification/notification';

interface IState {
    loading: boolean;
    resourceName: string;
    initialData: IRestApiResponse<unknown> | 'being-initialized';
}

class VirtualListFromQueryComponent<T extends IBaseRestApiResponse>
    extends SuperdeskReactComponent<IPropsVirtualListFromQuery<T> & {onInitialized(): void}, IState> {
    private virtualListRef: IExposedFromVirtualList;
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    /**
     * Debouncing is used to reduce bandwidth usage
     * that would otherwise be higher due to inability
     * to check whether created/updated item matches the query.
     */
    private reloadAllDebounced: () => void;

    constructor(props: IPropsVirtualListFromQuery<T> & {onInitialized(): void}) {
        super(props);

        this.state = {
            initialData: 'being-initialized',
            resourceName: null,
            loading: true,
        };

        this.fetchData = this.fetchData.bind(this);
        this.loadItems = this.loadItems.bind(this);

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.reloadAllDebounced = debounce(() => {
            this.virtualListRef.reloadAll();
        }, 2000, {leading: true, maxWait: 5000});
    }

    fetchData(pageToFetch: number, pageSize: number): Promise<IRestApiResponse<T>> {
        const query: ISuperdeskQuery = {
            filter: this.props.query.filter,
            fullTextSearch: this.props.query.fullTextSearch,
            sort: this.props.query.sort,
            page: pageToFetch,
            max_results: pageSize,
        };

        return this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<T>>(
            prepareSuperdeskQuery(this.props.query.endpoint, query),
        );
    }

    loadItems(fromIndex: number, toIndex: number): Promise<Map<number, T>> {
        const {state} = this;

        if (state.loading === true) {
            return Promise.resolve(Map());
        }

        const {pageSize, nextPage} = getPaginationInfo(fromIndex, toIndex);

        return this.fetchData(nextPage, pageSize).then((res) => {
            const start = (pageSize * nextPage) - pageSize;

            return Map<number, T>(res._items.map((item, i) => [start + i, item]));
        });
    }

    componentDidMount() {
        this.fetchData(1, 50).then((res) => {
            this.setState({loading: false, initialData: res, resourceName: res._links.self.title}, () => {
                this.props.onInitialized();
            });
        });

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener('resource:deleted', (event) => {
                const {resource} = event.extra;

                /**
                 * // CAUTION: potential efficiency/bandwidth issues
                 * we can't check(using websocket response) if deleted item matches the query
                 * neither can we get the index of that item
                 * reloading will be triggered even if deleted item didn't match the query
                 */
                if (resource === this.state.resourceName) {
                    this.reloadAllDebounced();
                }
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener('resource:created', (event) => {
                const {resource} = event.extra;

                /**
                 * // CAUTION: potential efficiency/bandwidth issues
                 * we can't check(using websocket response) if created item matches the query
                 * neither can we get the index of that item
                 * reloading will be triggered even if created item doesn't match the query
                 */
                if (resource === this.state.resourceName) {
                    this.reloadAllDebounced();
                }
            }),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener('resource:updated', (event) => {
                const {resource, _id} = event.extra;

                if (resource === this.state.resourceName) {
                    this.virtualListRef.reloadItem(_id);
                }
            }),
        );
    }

    componentWillUnmount(): void {
        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    render() {
        const {initialData} = this.state;

        if (initialData === 'being-initialized') {
            return null;
        }

        if (initialData._meta.total < 1) {
            const NoItemsTemplate = this.props.noItemsTemplate;

            return (
                <NoItemsTemplate />
            );
        }

        return (
            <VirtualList
                width={this.props.width}
                height={this.props.height}
                itemTemplate={this.props.itemTemplate}
                totalItemsCount={initialData._meta.total}
                initialItems={Map<number, T>(initialData._items.map((item, i) => [i, item]))}
                loadItems={this.loadItems}
                getId={(item) => item._id}
                ref={(virtualListRef) => {
                    this.virtualListRef = virtualListRef;
                }}
            />
        );
    }
}

export class VirtualListFromQuery<T extends IBaseRestApiResponse>
    extends React.PureComponent<IPropsVirtualListFromQuery<T>> {
    private smoothLoaderRef: SmoothLoaderForKey;

    constructor(props: IPropsVirtualListFromQuery<T>) {
        super(props);

        this.setLoaded = this.setLoaded.bind(this);
    }

    setLoaded() {
        this.smoothLoaderRef.setAsLoaded();
    }

    render() {
        const key = JSON.stringify(omit(
            this.props,
            'children',
            nameof<IPropsVirtualListFromQuery<T>>('width'),
            nameof<IPropsVirtualListFromQuery<T>>('height'),
        ));

        return (
            <div>
                <SmoothLoaderForKey
                    key_={key}
                    ref={(ref) => {
                        this.smoothLoaderRef = ref;
                    }}
                >
                    <VirtualListFromQueryComponent
                        {...this.props}
                        onInitialized={this.setLoaded}
                    />
                </SmoothLoaderForKey>
            </div>
        );
    }
}
