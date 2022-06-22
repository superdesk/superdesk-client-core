import React from 'react';
import {Map} from 'immutable';
import {omit} from 'lodash';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {IPropsVirtualListFromQuery, IRestApiResponse} from 'superdesk-api';
import {getPaginationInfo} from 'core/helpers/pagination';
import {toPyEveQuery} from 'core/query-formatting';
import {VirtualList} from './virtual-list';
import {SmoothLoaderForKey} from 'apps/search/components/SmoothLoaderForKey';
import {gettext} from 'core/utils';
import {nameof} from 'core/helpers/typescript-helpers';

interface IState {
    loading: boolean;
    resourceName: string;
    initialData: IRestApiResponse<unknown> | 'being-initialized';
}

class VirtualListFromQueryComponent<T>
    extends SuperdeskReactComponent<IPropsVirtualListFromQuery<T> & {onInitialized(): void}, IState> {
    constructor(props: IPropsVirtualListFromQuery<T> & {onInitialized(): void}) {
        super(props);

        this.state = {
            initialData: 'being-initialized',
            resourceName: null,
            loading: true,
        };

        this.fetchData = this.fetchData.bind(this);
        this.loadItems = this.loadItems.bind(this);
    }

    fetchData(pageToFetch: number, pageSize: number): Promise<IRestApiResponse<T>> {
        return this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<T>>({
            method: 'GET',
            path: this.props.query.endpoint,
            urlParams: {
                max_results: pageSize,
                page: pageToFetch,
                ...toPyEveQuery(this.props.query.filter, this.props.query.sort),
            },
        });
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
                initialItems={Map(initialData._items.map((item) => [item._id, item]))}
                loadItems={this.loadItems}
            />
        );
    }
}

export class VirtualListFromQuery<T> extends React.PureComponent<IPropsVirtualListFromQuery<T>> {
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
