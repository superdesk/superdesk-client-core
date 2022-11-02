/* eslint-disable max-depth */
import React from 'react';
import {Map} from 'immutable';
import {debounce, omit, trimStart} from 'lodash';
import {Set} from 'immutable';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {
    IBaseRestApiResponse,
    IPropsVirtualListFromQuery,
    IRestApiResponse,
    ISuperdeskQuery,
    IVirtualListQueryBase,
    IVirtualListQueryWithJoins,
} from 'superdesk-api';
import {getPaginationInfo} from 'core/helpers/pagination';
import {prepareSuperdeskQuery} from 'core/helpers/universal-query';
import {IExposedFromVirtualList, VirtualList} from './virtual-list';
import {SmoothLoaderForKey} from 'apps/search/components/SmoothLoaderForKey';
import {nameof} from 'core/helpers/typescript-helpers';
import {addWebsocketEventListener} from 'core/notification/notification';
import {fetchRelatedEntities, IEntitiesToFetch} from 'core/getRelatedEntities';

interface IState<T, IToJoin> {
    loading: boolean;
    resourceName: string;
    initialData: IFetchedData<T, IToJoin> | 'being-initialized';
    totalItems: number;
}

interface IFetchedItem<T, IToJoin> {
    entity: T;
    joined: Partial<IToJoin>;
}

interface IFetchedData<T, IToJoin> {
    items: Array<IFetchedItem<T, IToJoin>>;
    _meta: {
        total: number;
        resourceName: string;
    };
}

class VirtualListFromQueryComponent<T extends IBaseRestApiResponse, IToJoin extends {[key: string]: any}>
    extends SuperdeskReactComponent<
        IPropsVirtualListFromQuery<T, IToJoin> & {onInitialized(): void},
        IState<T, IToJoin>
    > {
    private virtualListRef: IExposedFromVirtualList;
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    /**
     * Debouncing is used to reduce bandwidth usage
     * that would otherwise be higher due to inability
     * to check whether created/updated item matches the query.
     */
    private reloadAllDebounced: () => void;

    constructor(props: IPropsVirtualListFromQuery<T, IToJoin> & {onInitialized(): void}) {
        super(props);

        this.state = {
            initialData: 'being-initialized',
            resourceName: null,
            loading: true,
            totalItems: 0,
        };

        this.fetchData = this.fetchData.bind(this);
        this.loadItems = this.loadItems.bind(this);

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.reloadAllDebounced = debounce(() => {
            this.virtualListRef.reloadAll();
        }, 2000, {leading: true, maxWait: 5000});
    }

    fetchData(pageToFetch: number, pageSize: number): Promise<IFetchedData<T, IToJoin>> {
        const query: ISuperdeskQuery = {
            filter: this.props.query.filter,
            fullTextSearch: this.props.query.fullTextSearch,
            sort: this.props.query.sort,
            page: pageToFetch,
            max_results: pageSize,
        };

        return this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<T>>(
            prepareSuperdeskQuery(this.props.query.endpoint, query),
        )
            .then((resEntities): Promise<IFetchedData<T, IToJoin>> => {
                const resourceName = resEntities._links == null
                    ? trimStart(this.props.query.endpoint, '/')
                    : resEntities._links.self.title;

                const relatedEntitiesToFetch: IEntitiesToFetch = {};

                function hasJoins(
                    x: IVirtualListQueryBase | IVirtualListQueryWithJoins<T, IToJoin>,
                ): x is IVirtualListQueryWithJoins<T, IToJoin> {
                    return x[nameof<IVirtualListQueryWithJoins<T, IToJoin>>('join')] != null;
                }

                function getStringEndpoint(endpoint: string | ((entity: T) => string), entity: T) {
                    if (typeof endpoint === 'string') {
                        return endpoint;
                    } else {
                        return endpoint(entity);
                    }
                }

                if (hasJoins(this.props.query)) {
                    const {join} = this.props.query;

                    for (const {endpoint, getId} of Object.values(join)) {
                        for (const entity of resEntities._items) {
                            if (relatedEntitiesToFetch[getStringEndpoint(endpoint, entity)] == null) {
                                relatedEntitiesToFetch[getStringEndpoint(endpoint, entity)] = Set([]);
                            }

                            relatedEntitiesToFetch[getStringEndpoint(endpoint, entity)] =
                                relatedEntitiesToFetch[getStringEndpoint(endpoint, entity)].add(getId(entity));
                        }
                    }

                    return fetchRelatedEntities(relatedEntitiesToFetch, this.abortController.signal).then((rel) => {
                        const listWithJoined = resEntities._items.map((entity) => {
                            const entityInclJoined: IFetchedItem<T, IToJoin> = {
                                entity: entity,
                                joined: {},
                            };

                            for (const entry of Object.entries(join)) {
                                const key = entry[0] as unknown as keyof IToJoin;
                                const {endpoint, getId} = entry[1];
                                const referencedEntityId = getId(entity);

                                if (referencedEntityId != null) {
                                    entityInclJoined.joined[key] =
                                        rel[getStringEndpoint(endpoint, entity)].get(referencedEntityId);
                                }
                            }

                            return entityInclJoined;
                        });

                        return {
                            items: listWithJoined,
                            _meta: {
                                total: resEntities._meta.total,
                                resourceName: resourceName,
                            },
                        };
                    });
                } else {
                    return Promise.resolve({
                        items: resEntities._items.map((entity) => ({entity, joined: {}})),
                        _meta: {
                            total: resEntities._meta.total,
                            resourceName: resourceName,
                        },
                    });
                }
            })
            .then((fetchedData) => {
                return new Promise<IFetchedData<T, IToJoin>>((resolve) => {
                    const initialData =
                        this.state.initialData === 'being-initialized' || this.state.initialData.items.length < 1
                            ? fetchedData
                            : this.state.initialData;

                    this.setState({
                        totalItems: fetchedData._meta.total,
                        resourceName: fetchedData._meta.resourceName,
                        initialData: initialData,
                    }, () => {
                        resolve(fetchedData);
                    });
                });
            });
    }

    loadItems(fromIndex: number, toIndex: number): Promise<Map<number, IFetchedItem<T, IToJoin>>> {
        const {state} = this;

        if (state.loading === true) {
            return Promise.resolve(Map());
        }

        const {pageSize, nextPage} = getPaginationInfo(fromIndex, toIndex);

        return this.fetchData(nextPage, pageSize).then((res) => {
            const start = (pageSize * nextPage) - pageSize;

            return Map<number, IFetchedItem<T, IToJoin>>(res.items.map((item, i) => [start + i, item]));
        });
    }

    componentDidMount() {
        this.fetchData(1, 50).then((res) => {
            this.setState({loading: false, initialData: res}, () => {
                this.props.onInitialized();
            });
        });

        // TODO: update joined entities

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

                const sortFields: Array<string> = this.props.query.sort.reduce((acc, item) => {
                    for (const key of Object.keys(item)) {
                        acc.push(key);
                    }

                    return acc;
                }, []);

                if (sortFields.some((field) => event.extra.fields[field] != null || field === '_updated')) {
                    // When a field user for sorting is updated, sorting order will most likely change.
                    this.virtualListRef.reloadAll();
                } else if (resource === this.state.resourceName) {
                    /**
                     * !!! may not be used when sorting order is not up to date.
                     * Relies on index based updates under the hood.
                     */
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
        const {initialData, totalItems} = this.state;

        if (initialData === 'being-initialized') {
            return null;
        }

        return (
            <VirtualList
                width={this.props.width}
                height={this.props.height}
                itemTemplate={({item}) => {
                    const Template = this.props.itemTemplate;

                    return (
                        <Template entity={item.entity} joined={item.joined} />
                    );
                }}
                totalItemsCount={totalItems}
                initialItems={Map<number, IFetchedItem<T, IToJoin>>(initialData.items.map((item, i) => [i, item]))}
                loadItems={this.loadItems}
                getId={(item) => item.entity._id}
                ref={(virtualListRef) => {
                    this.virtualListRef = virtualListRef;
                }}
            />
        );
    }
}

export class VirtualListFromQuery<T extends IBaseRestApiResponse, IToJoin>
    extends React.PureComponent<IPropsVirtualListFromQuery<T, IToJoin>> {
    private smoothLoaderRef: SmoothLoaderForKey;

    constructor(props: IPropsVirtualListFromQuery<T, IToJoin>) {
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
            nameof<IPropsVirtualListFromQuery<T, IToJoin>>('width'),
            nameof<IPropsVirtualListFromQuery<T, IToJoin>>('height'),
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
