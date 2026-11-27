import React from 'react';
import {Map} from 'immutable';
import {IArticle, IRestApiResponse, ISuperdeskQuery} from 'superdesk-api';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';
import {toElasticQuery} from './query-formatting';
import {SmoothLoaderOuter} from 'apps/search/components/SmoothLoaderOuter';
import {addInternalWebsocketEventListener} from './notification/notification';
import {notNullOrUndefined} from './helpers/typescript-helpers';

interface IProps {
    ids: Array<IArticle['_id']>;

    /**
     * children needs to be a function, otherwise it would get executed before data is loaded.
     * Items that can't be found (deleted, or not visible to the user) are left out.
     */
    children: (items: Array<IArticle>) => JSX.Element;
}

interface IState {
    // `null` for an item that can't be found
    items: Map<IArticle['_id'], IArticle | null>;
}

export class WithArticles extends SuperdeskReactComponent<IProps, IState> {
    loader: SmoothLoaderOuter;
    private fetching: Set<IArticle['_id']>;
    private removeListeners: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            items: Map(),
        };

        this.fetching = new Set();
        this.removeListeners = [];

        this.fetchItems = this.fetchItems.bind(this);
        this.refetchItem = this.refetchItem.bind(this);
    }

    /**
     * `/search` is the only source of ingest items. Anything it does not return is read from `archive`, as angular
     * does for every item, which covers an item not indexed yet; one that is not there either can't be found.
     */
    loadItems(ids: Array<IArticle['_id']>) {
        ids.forEach((id) => this.fetching.add(id));

        const query: ISuperdeskQuery = {
            // a published item is served from the `published` repo, where only `item_id` holds the archive id
            filter: {$or: [{'_id': {$in: ids}}, {'item_id': {$in: ids}}]},
            page: 1,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}],
        };

        this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/search',
            urlParams: {
                aggregations: 0,
                es_highlight: 1,
                ...toElasticQuery(query),
            },
        }).then((res) => {
            const found = Map<IArticle['_id'], IArticle | null>(res._items.map((item) => [item._id, item]));

            return Promise.all(
                ids.filter((id) => !found.has(id)).map((id) => this.fetchFromArchive(id)),
            ).then((fromArchive) => found.merge(Map(fromArchive)));
        }).then((loaded) => {
            ids.forEach((id) => this.fetching.delete(id));
            this.setState((state) => ({items: state.items.merge(loaded)}));
        }).catch(() => {
            ids.forEach((id) => this.fetching.delete(id));
        });
    }

    // Only a 404 means the item is gone. Any other error rejects and leaves the item loading: an editor that
    // saves the items it shows would otherwise drop one that only failed to load.
    fetchFromArchive(id: IArticle['_id']): Promise<[IArticle['_id'], IArticle | null]> {
        return this.asyncHelpers.httpRequestJsonLocal<IArticle>({method: 'GET', path: `/archive/${id}`})
            .then((item): [IArticle['_id'], IArticle | null] => [id, item])
            .catch((error): [IArticle['_id'], IArticle | null] | Promise<never> => (
                error?._error?.code === 404 ? [id, null] : Promise.reject(error)
            ));
    }

    fetchItems() {
        const itemsToFetch = this.props.ids.filter((id) => this.state.items.has(id) !== true && !this.fetching.has(id));

        if (itemsToFetch.length > 0) {
            this.loadItems(itemsToFetch);
        }
    }

    // `/search` can still return the item from before the lock change, so it is read from `archive`
    refetchItem(id: IArticle['_id']) {
        if (this.props.ids.includes(id)) {
            this.fetchFromArchive(id).then((entry) => {
                this.setState((state) => ({items: state.items.merge(Map([entry]))}));
            }).catch(() => {
                // the item stays as last loaded
            });
        }
    }

    componentDidMount() {
        this.fetchItems();

        this.removeListeners.push(
            addInternalWebsocketEventListener('item:lock', (message) => this.refetchItem(message.extra.item)),
            addInternalWebsocketEventListener('item:unlock', (message) => this.refetchItem(message.extra.item)),
        );
    }

    componentDidUpdate() {
        this.fetchItems();
    }

    componentWillUnmount() {
        this.removeListeners.forEach((removeListener) => removeListener());
    }

    render() {
        const allItemsLoaded = this.props.ids.every((id) => this.state.items.has(id));

        return (
            <SmoothLoaderOuter loading={allItemsLoaded !== true}>
                {() => this.props.children(
                    this.props.ids.map((id) => this.state.items.get(id)).filter(notNullOrUndefined),
                )}
            </SmoothLoaderOuter>
        );
    }
}
