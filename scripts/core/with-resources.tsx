import React from 'react';
import {groupBy, omit} from 'lodash';
import {IBaseRestApiResponse, ILiveResourcesProps, IResourceChange, IRestApiResponse} from 'superdesk-api';
import {fetchChangedResources} from './helpers/CrudManager';
import {throttleAndCombineArray} from './itemList/throttleAndCombine';
import {addWebsocketEventListener} from './notification/notification';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';
import {SmoothLoaderForKey} from 'apps/search/components/SmoothLoaderForKey';

interface IState {
    data?: {[resource: string]: IRestApiResponse<unknown>};
}

/**
 * Doesn't work with elastic search endpoints, only with mongo ones.
 */
class WithLiveResourcesComponent
    extends SuperdeskReactComponent<ILiveResourcesProps & {onInitialized(): void}, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    private handleContentChangesThrottled: (changes: Array<IResourceChange>) => void;
    private updatingRequestInProgress: boolean;

    constructor(props: ILiveResourcesProps & {onInitialized(): void}) {
        super(props);

        this.state = {};

        this.updatingRequestInProgress = false;
        this.eventListenersToRemoveBeforeUnmounting = [];

        this.fetchItems = this.fetchItems.bind(this);
        this.handleContentChanges = this.handleContentChanges.bind(this);

        this.handleContentChangesThrottled = throttleAndCombineArray(
            (changes: Array<IResourceChange>) => {
                this.handleContentChanges(changes);
            },
            1000,
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:created',
                (event) => {
                    const {resource, _id} = event.extra;

                    if (this.props.resources.find((r) => r.resource === resource) != null) {
                        this.handleContentChangesThrottled([{changeType: 'created', resource: resource, itemId: _id}]);
                    }
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:updated',
                (event) => {
                    const {resource, _id, fields} = event.extra;

                    if (this.props.resources.find((r) => r.resource === resource) != null) {
                        this.handleContentChangesThrottled([{
                            changeType: 'updated',
                            resource: resource,
                            itemId: _id,
                            fields: fields,
                        }]);
                    }
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:deleted',
                (event) => {
                    const {resource, _id} = event.extra;

                    if (this.props.resources.find((r) => r.resource === resource) != null) {
                        this.handleContentChangesThrottled([{changeType: 'deleted', resource: resource, itemId: _id}]);
                    }
                },
            ),
        );
    }

    fetchItems(): Promise<void> {
        const {resources} = this.props;

        function toPair(resource: string, res: unknown): [string, unknown] {
            return [resource, res];
        }

        return Promise.all(
            resources.map(({resource, ids}) => {
                return this.asyncHelpers.httpRequestJsonLocal({
                    method: 'GET',
                    path: ids != null
                        ? `/${resource}?where=${JSON.stringify({_id: {$in: ids}})}`
                        : `/${resource}`,
                }).then((res) => toPair(resource, res));
            }),
        ).then((pairs) => {
            var data = {};

            for (const [resource, res] of pairs) {
                data[resource] = res;
            }

            this.setState({data});
        });
    }

    handleContentChanges(_changes: Array<IResourceChange>) {
        const state = this.state;
        const dataInitialized = state.data != null;

        if (this.updatingRequestInProgress || dataInitialized !== true) {
            this.handleContentChangesThrottled(_changes);
            return;
        }

        const changes = _changes.filter(({resource}) => state.data[resource] != null);
        const changesByResource = groupBy(changes, (change) => change.resource);

        Promise.all(
            Object.keys(changesByResource).map((resource) => {
                return fetchChangedResources<IBaseRestApiResponse>(
                    resource,
                    changesByResource[resource],
                    state.data[resource]._items,
                    new Set(),
                    this.abortController.signal,
                ).then((res) => {
                    if (res === 'requires-refetching-all') {
                        this.fetchItems();

                        return Promise.reject('will-refetch-all');
                    }

                    const currentItemsResponse = state.data[resource];
                    const diff: number = currentItemsResponse._items.length - res.length;

                    const nextItemsResponse: IRestApiResponse<unknown> = {
                        ...currentItemsResponse,
                        _items: res,
                        _meta: {
                            ...currentItemsResponse._meta,
                            total: currentItemsResponse._meta.total - diff,
                        },
                    };

                    return {resource: resource, value: nextItemsResponse};
                });
            }),
        ).then((updatesArray) => {
            const updates = updatesArray.reduce((acc, {resource, value}) => {
                acc[resource] = value;

                return acc;
            }, {});

            this.setState({data: {...state.data, ...updates}});

            this.updatingRequestInProgress = false;
        }).catch((err) => {
            if (err !== 'will-refetch-all') {
                throw err;
            }
        });
    }

    componentDidMount() {
        this.fetchItems().then(() => {
            this.props.onInitialized();
        });
    }

    componentWillUnmount() {
        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    render() {
        const state = this.state;

        if (state.data == null) {
            return null;
        } else {
            return this.props.children(this.props.resources.map(({resource}) => state.data[resource]));
        }
    }
}

export class WithLiveResources
    extends React.PureComponent<ILiveResourcesProps, {loading: boolean}> {
    private smoothLoaderRef: SmoothLoaderForKey;

    constructor(props: ILiveResourcesProps) {
        super(props);

        this.setLoaded = this.setLoaded.bind(this);
    }

    setLoaded() {
        this.smoothLoaderRef.setAsLoaded();
    }

    render() {
        const key = JSON.stringify(omit(this.props, 'children'));

        return (
            <div>
                <SmoothLoaderForKey
                    key_={key}
                    ref={(ref) => {
                        this.smoothLoaderRef = ref;
                    }}
                >
                    <WithLiveResourcesComponent
                        {...this.props}
                        onInitialized={this.setLoaded}
                    />
                </SmoothLoaderForKey>
            </div>
        );
    }
}
