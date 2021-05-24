/* eslint-disable react/no-multi-comp */

import React from 'react';
import {ArticlesListV2} from './ArticlesListV2';
import {IRestApiResponse, IArticle, ISuperdeskQuery} from 'superdesk-api';
import {flatMap} from 'lodash';
import ng from 'core/services/ng';
import {toElasticQuery, getQueryFieldsRecursive} from './query-formatting';
import {SmoothLoader} from 'apps/search/components/SmoothLoader';
import {IMultiSelectNew} from 'apps/search/components/ItemList';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';
import {OrderedMap} from 'immutable';

interface IProps {
    query: ISuperdeskQuery;
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
    header?(itemCount: number): JSX.Element;
    padding?: string;
    getMultiSelect?: (items: OrderedMap<string, IArticle>) => IMultiSelectNew;
}

interface IState {
    itemCount: number | 'loading';
}

interface IPropsInner extends IProps {
    setLoading(value: boolean): Promise<void>;
}

class ArticlesListByQueryComponent extends SuperdeskReactComponent<IPropsInner, IState> {
    constructor(props: IPropsInner) {
        super(props);

        this.state = {
            itemCount: 'loading',
        };

        this.loadItems = this.loadItems.bind(this);
    }
    loadItems(from, to): Promise<IRestApiResponse<any>> {
        const pageSize = to - from;

        const withPagination = {
            ...this.props.query,
            page: Math.floor(from / pageSize),
            max_results: pageSize,
        };

        const query = toElasticQuery(withPagination);

        return this.props.setLoading(true).then(() => {
            return this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<IArticle>>({
                method: 'GET',
                path: '/search',
                urlParams: {
                    aggregations: 0,
                    es_highlight: 1,
                    projections: JSON.stringify(ng.get('search').getProjectedFields()),
                    source: JSON.stringify(query),
                },
            }).then((res) => {
                return new Promise((resolve) => {
                    const firstLoad = this.state.itemCount === 'loading';

                    // update item count
                    this.setState({itemCount: res._meta.total}, () => {
                        resolve(res);

                        if (!firstLoad) {
                            // Add a delay to allow child components to re-render.
                            // Avoids a state with loader no longer displayed, but items list still empty.
                            setTimeout(() => {
                                this.props.setLoading(false);
                            });
                        }
                    });
                });
            });
        });
    }
    componentDidMount() {
        // Making a request for getting the item count.
        // Item count is required for virtual scrolling in order to compute the height of the scroll-box.
        this.loadItems(0, 1).then((res) => {
            this.setState({
                itemCount: res._meta.total,
            });
        });
    }

    render() {
        if (this.state.itemCount === 'loading') {
            return null;
        }

        const {itemCount} = this.state;

        return (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {
                    this.props.header == null
                        ? null

                        // adding a wrapper in order to have a "clean" flex child
                        : <div>{this.props.header(itemCount)}</div>
                }

                <div style={{flexGrow: 1, overflow: 'hidden'}}>
                    <ArticlesListV2
                        itemCount={itemCount}
                        pageSize={this.props.query.max_results}
                        loadItems={(from, to) => this.loadItems(from, to).then(({_items}) => _items)}
                        shouldReloadTheList={(changedFields) => {
                            /** TODO: Have websockets transmit the diff.
                             * The component should not update when field value changes do not affect the query -
                             * for example, if the query is {desk: 'X'} and an update is about an item moved
                             * from desk Y to Z.
                             */

                            const queryFields = getQueryFieldsRecursive(this.props.query.filter);

                            // add sorting fields
                            flatMap(this.props.query.sort, (option) => Object.keys(option)).forEach((sortField) => {
                                queryFields.add(sortField);
                            });

                            return Array.from(changedFields).some((changedField) => queryFields.has(changedField));
                        }}
                        onItemClick={this.props.onItemClick}
                        onItemDoubleClick={this.props.onItemDoubleClick}
                        padding={this.props.padding}
                        getMultiSelect={this.props.getMultiSelect}
                    />
                </div>
            </div>
        );
    }
}

export class ArticlesListByQuery extends React.PureComponent<IProps, {initialized: boolean}> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };

        this.setLoading = this.setLoading.bind(this);
    }

    private setLoading(loading: boolean): Promise<void> {
        return new Promise((resolve) => {
            const callback = () => {
                resolve();
            };

            if (this.state.initialized !== true && loading === false) {
                this.setState({initialized: true}, callback);
            } else {
                callback();
            }
        });
    }

    componentWillReceiveProps(nextProps: IProps) {
        const currentKey = JSON.stringify(this.props.query);
        const nextKey = JSON.stringify(nextProps.query);

        if (currentKey !== nextKey) {
            this.setState({initialized: false});
        }
    }

    render() {
        // // re-mount the component when the query changes
        const key = JSON.stringify(this.props.query);

        return (
            <SmoothLoader loading={this.state.initialized !== true}>
                <ArticlesListByQueryComponent
                    {...this.props}
                    setLoading={this.setLoading}
                    key={key}
                />
            </SmoothLoader>
        );
    }
}
