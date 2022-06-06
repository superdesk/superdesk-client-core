import React from 'react';
import {Map} from 'immutable';
import {IArticle, IRestApiResponse, ISuperdeskQuery} from 'superdesk-api';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';
import {toElasticQuery} from './query-formatting';
import {SmoothLoaderOuter} from 'apps/search/components/SmoothLoaderOuter';

interface IProps {
    ids: Array<IArticle['_id']>;

    /**
     * children needs to be a function, otherwise it would get executed before data is loaded
     */
    children: (items: Array<IArticle>) => JSX.Element;
}

interface IState {
    items: Map<IArticle['_id'], IArticle>;
}

export class WithArticles extends SuperdeskReactComponent<IProps, IState> {
    loader: SmoothLoaderOuter;
    constructor(props: IProps) {
        super(props);

        this.state = {
            items: Map(),
        };

        this.fetchItems = this.fetchItems.bind(this);
    }

    fetchItems() {
        const itemsToFetch = this.props.ids.filter((id) => this.state.items.has(id) !== true);

        const query: ISuperdeskQuery = {
            filter: {$and: [{'_id': {$in: itemsToFetch}}]},
            page: 0,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}],
        };

        if (itemsToFetch.length > 0) {
            this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<IArticle>>({
                method: 'GET',
                path: '/search',
                urlParams: {
                    aggregations: 0,
                    es_highlight: 1,
                    source: JSON.stringify(toElasticQuery(query)),
                },
            }).then((res) => {
                this.setState({
                    items: this.state.items.merge(Map(res._items.map((item) => [item._id, item]))),
                });
            });
        }
    }

    componentDidMount() {
        this.fetchItems();
    }

    componentDidUpdate() {
        this.fetchItems();
    }

    render() {
        const allItemsLoaded = this.props.ids.every((id) => this.state.items.has(id));

        return (
            <SmoothLoaderOuter loading={allItemsLoaded !== true}>
                {() => this.props.children(this.props.ids.map((id) => this.state.items.get(id)))}
            </SmoothLoaderOuter>
        );
    }
}
