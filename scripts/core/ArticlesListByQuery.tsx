/* eslint-disable react/no-multi-comp */

import React from 'react';
import {ArticlesListV2} from './ArticlesListV2';
import {IRestApiResponse, IArticle} from 'superdesk-api';
import {httpRequestJsonLocal} from './helpers/network';
import {flatMap} from 'lodash';
import ng from 'core/services/ng';
import {ISuperdeskQuery, toElasticQuery, getQueryFieldsRecursive} from './query-formatting';

interface IProps {
    query: ISuperdeskQuery;
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
    header?(itemCount: number): JSX.Element;
}

interface IState {
    initialized: boolean;
    itemCount: number;
}

class ArticlesListByQueryComponent extends React.PureComponent<IProps, IState> {
    articlesListRef: ArticlesListV2;

    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
            itemCount: 0,
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

        return httpRequestJsonLocal<IRestApiResponse<IArticle>>({
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
                // update item count

                this.setState({itemCount: res._meta.total}, () => {
                    resolve(res);
                });
            });
        });
    }
    componentDidMount() {
        this.loadItems(0, 1).then((res) => {
            this.setState({
                initialized: true,
                itemCount: res._meta.total,
            });
        });
    }
    render() {
        if (this.state.initialized !== true) {
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
                    />
                </div>
            </div>
        );
    }
}

export class ArticlesListByQuery extends React.PureComponent<IProps> {
    render() {
        // re-mount the component when the query changes
        const key = JSON.stringify(this.props.query);

        return (
            <ArticlesListByQueryComponent
                key={key}
                {...this.props}
            />
        );
    }
}