import {IBaseRestApiResponse, ILiveQueryProps, IResourceChange, IRestApiResponse} from 'superdesk-api';
import {fetchChangedResources} from './helpers/CrudManager';
import {httpRequestJsonLocal} from './helpers/network';
import {throttleAndCombineArray} from './itemList/throttleAndCombine';
import {addWebsocketEventListener} from './notification/notification';
import {getQueryFieldsRecursive, toElasticQuery} from './query-formatting';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';

interface IState<T extends IBaseRestApiResponse> {
    data?: IRestApiResponse<T>; // undefined until initialized
}

export class WithLiveQuery
    <T extends IBaseRestApiResponse> extends SuperdeskReactComponent<ILiveQueryProps<T>, IState<T>> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    private handleContentChangesThrottled: (changes: Array<IResourceChange>) => void;
    private updatingRequestInProgress: boolean;

    constructor(props: ILiveQueryProps<T>) {
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

                    if (resource === this.props.resource) {
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

                    if (resource === this.props.resource) {
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

                    if (resource === this.props.resource) {
                        this.handleContentChangesThrottled([{changeType: 'deleted', resource: resource, itemId: _id}]);
                    }
                },
            ),
        );
    }

    fetchItems(): void {
        const {resource, query} = this.props;

        httpRequestJsonLocal<IRestApiResponse<T>>(
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
            this.setState({data: data});
        });
    }

    handleContentChanges(changes: Array<IResourceChange>) {
        const {data} = this.state;
        const dataInitialized = data != null;

        if (this.updatingRequestInProgress || dataInitialized !== true) {
            this.handleContentChangesThrottled(changes);
            return;
        }

        this.updatingRequestInProgress = true;

        fetchChangedResources(
            this.props.resource,
            changes,
            this.state.data._items,
            getQueryFieldsRecursive(this.props.query.filter),
            this.abortController.signal,
        ).then((res) => {
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
                });
            }
        }).finally(() => {
            this.updatingRequestInProgress = false;
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
        const {data} = this.state;

        if (data == null) {
            return null;
        } else {
            return this.props.children(data);
        }
    }
}
