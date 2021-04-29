import React from 'react';
import {IBaseRestApiResponse, ILiveQueryProps, IResourceChange, IRestApiResponse} from 'superdesk-api';
import {fetchChangedResources} from './helpers/CrudManager';
import {httpRequestJsonLocal} from './helpers/network';
import {throttleAndCombineArray} from './itemList/throttleAndCombine';
import {addWebsocketEventListener} from './notification/notification';
import {getQueryFieldsRecursive, toElasticQuery} from './query-formatting';

type IState<T extends IBaseRestApiResponse> = {loading: true} | IStateReady<T>;

interface IStateReady<T extends IBaseRestApiResponse> {
    data: IRestApiResponse<T>;
    loading: false;
}

export class WithLiveQuery<T extends IBaseRestApiResponse> extends React.PureComponent<ILiveQueryProps<T>, IState<T>> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    private handleContentChangesThrottled: (changes: Array<IResourceChange>) => void;

    constructor(props: ILiveQueryProps<T>) {
        super(props);

        this.state = {loading: true};

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.fetchItems = this.fetchItems.bind(this);
        this.handleContentChanges = this.handleContentChanges.bind(this);

        this.handleContentChangesThrottled = throttleAndCombineArray(
            (changes: Array<IResourceChange>) => {
                this.handleContentChanges(changes);
            },
            300,
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:created',
                (event) => {
                    const {resource, _id} = event.extra;

                    this.handleContentChangesThrottled([{changeType: 'created', resource: resource, itemId: _id}]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:updated',
                (event) => {
                    const {resource, _id, fields} = event.extra;

                    this.handleContentChangesThrottled([{
                        changeType: 'updated',
                        resource: resource,
                        itemId: _id,
                        fields: fields,
                    }]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketEventListener(
                'resource:deleted',
                (event) => {
                    const {resource, _id} = event.extra;

                    this.handleContentChangesThrottled([{changeType: 'deleted', resource: resource, itemId: _id}]);
                },
            ),
        );
    }

    fetchItems() {
        const {resource, query} = this.props;

        return httpRequestJsonLocal<IRestApiResponse<T>>(
            {
                method: 'GET',
                path: '/' + resource,
                urlParams: {
                    aggregations: 0,
                    es_highlight: 1,
                    source: JSON.stringify(toElasticQuery(query)),
                },
            },
        ).then((data) => {
            this.setState({data: data, loading: false});
        });
    }

    handleContentChanges(changes: Array<IResourceChange>) {
        if (this.state.loading === true) {
            return;
        }

        fetchChangedResources(
            this.props.resource,
            changes,
            this.state.data._items,
            getQueryFieldsRecursive(this.props.query.filter),
        ).then((res) => {
            if (this.state.loading === true) {
                return false;
            }

            const {data} = this.state;

            if (res === 'requires-refetching-all') {
                this.fetchItems();
            } else {
                const diff: number = data._items.length - res.length;

                this.setState({
                    data: {
                        ...data,
                        _items: res,
                        _meta: {
                            ...data._meta,
                            total: data._meta.total - diff,
                        },
                    },
                    loading: false,
                });
            }
        });
    }

    componentDidMount() {
        this.fetchItems();
    }

    componentWillUnmount() {
        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    render() {
        if (this.state.loading === true) {
            return null;
        } else {
            return this.props.children(this.state.data);
        }
    }
}
