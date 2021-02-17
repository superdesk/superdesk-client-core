/* eslint-disable react/no-multi-comp */

import React from 'react';
import {ArticlesListV2} from './ArticlesListV2';
import {IRestApiResponse, IArticle} from 'superdesk-api';
import {flatMap, once} from 'lodash';
import ng from 'core/services/ng';
import {ISuperdeskQuery, toElasticQuery, getQueryFieldsRecursive} from './query-formatting';
import {Loader} from 'superdesk-ui-framework/react/components/Loader';
import {IMultiSelectNew} from 'apps/search/components/ItemList';
import {SuperdeskReactComponent} from './SuperdeskReactComponent';

interface IProps {
    query: ISuperdeskQuery;
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
    header?(itemCount: number): JSX.Element;
    padding?: string;
    multiSelect?: IMultiSelectNew;
}

interface IPropsInner extends IProps {
    beforeUnmount(): void;
    afterInitialized(): void;
}

interface IState {
    itemCount: number | 'loading';
}

class ArticlesListByQueryComponent extends SuperdeskReactComponent<IPropsInner, IState> {
    markAsInitializedOnce: () => void;

    constructor(props: IPropsInner) {
        super(props);

        this.state = {
            itemCount: 'loading',
        };

        this.loadItems = this.loadItems.bind(this);
        this.markAsInitializedOnce = once(() => {
            this.props.afterInitialized();
        });
    }
    loadItems(from, to): Promise<IRestApiResponse<any>> {
        const pageSize = to - from;

        const withPagination = {
            ...this.props.query,
            page: Math.floor(from / pageSize),
            max_results: pageSize,
        };

        const query = toElasticQuery(withPagination);

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
                // update item count

                this.setState({itemCount: res._meta.total}, () => {
                    resolve(res);
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
    componentWillUnmount() {
        this.props.beforeUnmount();
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
                        loadItems={(from, to) => this.loadItems(from, to).then(({_items}) => {
                            this.markAsInitializedOnce();

                            return _items;
                        })}
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
                        multiSelect={this.props.multiSelect}
                    />
                </div>
            </div>
        );
    }
}

/** Wrapper component for:
 * 1. Re-mounting when query changes.
 * 2. Better loading experience - capture generated HTML of the component before it unmounts and display it
 * until the component with the new data is mounted.
 */
export class ArticlesListByQuery extends React.PureComponent<IProps, {lastHtml: string}> {
    elementRef: HTMLDivElement;

    constructor(props: IProps) {
        super(props);

        this.handleUnmount = this.handleUnmount.bind(this);
        this.handleInitialized = this.handleInitialized.bind(this);

        this.state = {
            // Display loading indicator on first load too.
            lastHtml: '<div></div>',
        };
    }

    handleUnmount() {
        this.setState({lastHtml: this.elementRef.innerHTML});
    }

    handleInitialized() {
        this.setState({lastHtml: null});
    }

    render() {
        // re-mount the component when the query changes
        const key = JSON.stringify(this.props.query);

        const {lastHtml} = this.state;
        const style: React.CSSProperties = lastHtml == null
            ? {height: '100%'}
            : {height: '100%', position: 'absolute', left: -9999, top: -9999};

        return (
            <div
                style={{height: '100%'}}
                ref={(component) => {
                    if (component != null) {
                        this.elementRef = component;
                    }
                }}
            >
                {
                    lastHtml == null ? null : (
                        <div style={{height: '100%', position: 'relative'}}>
                            <Loader overlay />
                            <div dangerouslySetInnerHTML={{__html: lastHtml}} style={{height: '100%'}} />
                        </div>
                    )
                }

                <div style={style}>
                    <ArticlesListByQueryComponent
                        {...this.props}
                        key={key}
                        beforeUnmount={this.handleUnmount}
                        afterInitialized={this.handleInitialized}
                    />
                </div>
            </div>
        );
    }
}
