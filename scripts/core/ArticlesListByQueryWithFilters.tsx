/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticle, ISortOption, IRestApiResponse, ISuperdeskQuery, IAndOperator, IOrOperator} from 'superdesk-api';
import {toElasticQuery} from './query-formatting';
import {ArticlesListByQuery} from './ArticlesListByQuery';
import {Set, Map} from 'immutable';
import classNames from 'classnames';
import {gettext, gettextPlural, getItemTypes} from './utils';
import {getArticleSortOptions, generateTrackByIdentifier} from 'apps/search/services/SearchService';
import {SearchBar} from './ui/components';
import {SortBar} from './ui/components/SortBar';
import {Badge} from './ui/components/Badge';
import {MultiSelectHoc} from './MultiSelectHoc';
import {IArticleActionBulkExtended, MultiActionBarReact} from 'apps/monitoring/MultiActionBarReact';
import {getMultiActions} from 'apps/search/controllers/get-multi-actions';
import {Button} from 'superdesk-ui-framework';
import {ButtonGroup} from 'superdesk-ui-framework';
import {SubNav} from 'superdesk-ui-framework';
import ng from 'core/services/ng';
import {getBulkActions} from 'apps/search/controllers/get-bulk-actions';
import {ResizeObserverComponent} from './components/resize-observer-component';
import {httpRequestJsonLocal} from './helpers/network';
import {MultiSelect} from './ArticlesListV2MultiSelect';
import {ARTICLE_RELATED_RESOURCE_NAMES} from './constants';

const COMPACT_WIDTH = 700;

type IFilterValue = string | number;

interface IProps {
    heading: string;
    query: ISuperdeskQuery;
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
    getExtraButtons?(): Array<{label: string; onClick: () => void}>;
}

interface IState {
    activeFilters: Map<string, Set<IFilterValue>>;
    fullTextSearch: string;
    sortOption: ISortOption;
}

function getQueryWithFilters(
    originalQuery: ISuperdeskQuery,
    filters: IState['activeFilters'],
    fullTextSearch: string,
    sortOption: ISortOption,
): ISuperdeskQuery {
    const patch: Partial<ISuperdeskQuery> = {
        sort: [{[sortOption.field]: sortOption.direction === 'ascending' ? 'asc' : 'desc'}],
    };

    if ((fullTextSearch?.length ?? 0) > 0) {
        patch.fullTextSearch = fullTextSearch;
    }

    if (filters.size > 0) {
        var filtersQuery: IAndOperator = {$and: []};

        filters.forEach((value, key) => {
            if (value.size > 1) {
                const orQuery: IOrOperator = {$or: []};

                value.forEach((val) => {
                    orQuery.$or.push({[key]: {$eq: val}});
                });

                filtersQuery.$and.push(orQuery);
            } else {
                filtersQuery.$and.push({[key]: {$eq: value.first()}});
            }
        });

        patch['filter'] = {
            $and: [
                originalQuery.filter,
                filtersQuery.$and.length > 1 ? filtersQuery : filtersQuery.$and[0],
            ],
        };
    }

    return {
        ...originalQuery,
        ...patch,
    };
}

export class ArticlesListByQueryWithFilters extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            activeFilters: Map(),
            fullTextSearch: '',
            sortOption: {field: 'versioncreated', direction: 'descending'},

        };

        this.setFilter = this.setFilter.bind(this);
        this.hasFilter = this.hasFilter.bind(this);
        this.toggleFilter = this.toggleFilter.bind(this);
    }
    setFilter(key: string, value: IFilterValue) {
        const {activeFilters} = this.state;

        this.setState({
            activeFilters: activeFilters.set(key, (activeFilters.get(key) ?? Set()).add(value)),
        });
    }
    removeFilter(key: string, value?: IFilterValue) {
        const {activeFilters} = this.state;

        const filter = activeFilters.get(key);

        if (filter == null) {
            return;
        }

        if (
            value == null
            || filter.size === 1 // don't leave a key without filters
        ) {
            this.setState({
                activeFilters: activeFilters.remove(key),
            });
        } else {
            this.setState({
                activeFilters: value == null
                    ? activeFilters.remove(key)
                    : activeFilters.set(key, filter.remove(value)),
            });
        }
    }
    toggleFilter(key: string, value: IFilterValue) {
        if (this.hasFilter(key, value)) {
            this.removeFilter(key, value);
        } else {
            this.setFilter(key, value);
        }
    }
    hasFilter(key: string, value?: IFilterValue) {
        const values = this.state.activeFilters.get(key);

        if (value == null) {
            return values != null;
        } else {
            return values?.has(value) ?? false;
        }
    }
    render() {
        const padding = 20;
        const extraButtons = this.props.getExtraButtons?.() ?? null;

        const query: ISuperdeskQuery = getQueryWithFilters(
            this.props.query,
            this.state.activeFilters,
            this.state.fullTextSearch,
            this.state.sortOption,
        );

        /**
         * When multi-select is started, filter/sort bar disappears and multi-select toolbar appears.
         * Height is hardcoded in order for the position of all items to remain the same.
         */
        const toolbar2Height = 50;

        const getTypeFilteringComponent = (compact: boolean) => {
            interface IFileTypeOption {
                label: string;
                icon?: string;
                selected: boolean;
                onSelect: () => void;
            }

            const filterAll: IFileTypeOption = {
                label: gettext('All'),
                selected: this.hasFilter('type') === false,
                onSelect: () => {
                    this.removeFilter('type');
                },
            };

            const options: Array<IFileTypeOption> =
            getItemTypes().map((itemType) => {
                return {
                    label: itemType.label,
                    icon: itemType.type !== 'all' ? `filetype-icon-${itemType.type}` : null,
                    selected: itemType.type !== 'all' ?
                        this.hasFilter('type', itemType.type) :
                        this.hasFilter('type') === false,
                    onSelect: () => {
                        itemType.type !== 'all' ?
                            this.toggleFilter('type', itemType.type) :
                            this.removeFilter('type');
                    },
                };
            });

            // TODO: Implement compact mode when multi select component is available in UI framework.

            return (
                <div className="sd-display--contents">
                    <ButtonGroup padded={true} align="start">
                        {options.map(({label, icon, selected, onSelect}) => (
                            <button
                                key={label}
                                className={classNames(
                                    'toggle-button',
                                    {'toggle-button--active': selected},
                                )}
                                onClick={() => {
                                    onSelect();
                                }}
                                aria-label={label}
                            >
                                {
                                    icon != null
                                        ? <i className={`toggle-button__icon ${icon}`} />
                                        : label
                                }
                            </button>
                        ))}
                    </ButtonGroup>
                </div>
            );
        };

        const sortFilterToolbar = (
            <ResizeObserverComponent>
                {(dimensions) => (
                    <SubNav zIndex={4}>
                        {getTypeFilteringComponent(dimensions.width < COMPACT_WIDTH)}

                        <SortBar
                            sortOptions={getArticleSortOptions()}
                            selected={this.state.sortOption}
                            onSortOptionChange={(sortOption) => {
                                this.setState({sortOption});
                            }}
                        />
                    </SubNav>
                )}
            </ResizeObserverComponent>
        );

        return (
            <MultiSelectHoc
                resourceNames={ARTICLE_RELATED_RESOURCE_NAMES}
                getId={(item: IArticle) => generateTrackByIdentifier(item)}
                shouldUnselect={(ids) => {
                    // Use the same query except only for selected items.
                    const queryForSpecificItems: ISuperdeskQuery = {
                        ...query,
                        page: 0,
                        max_results: 200,
                        filter: {
                            $and: [
                                query.filter,
                                {'_id': {$in: ids.toJS()}},
                            ],
                        },
                    };

                    const elasticQuery = toElasticQuery(queryForSpecificItems);

                    return httpRequestJsonLocal<IRestApiResponse<Pick<IArticle, '_id' | 'state' | '_current_version'>>>(
                        {
                            method: 'GET',
                            path: '/search',
                            urlParams: {
                                aggregations: 0,
                                es_highlight: 1,
                                projections: JSON.stringify(['_id', 'state', '_current_version']),
                                source: JSON.stringify(elasticQuery),
                            },
                        },
                    ).then((res) => {
                        var stillMatchQuery = Set(res._items.map((item) => generateTrackByIdentifier(item)));

                        return ids.filter((id) => stillMatchQuery.has(id) !== true).toSet();
                    });
                }}
            >
                {(multiSelectOptions) => {
                    const getMultiSelectToolbar = (articles: Array<IArticle>) => {
                        const getSelectedItems = () => articles;
                        const unselectAll = () => multiSelectOptions.unselectAll();

                        const multiActions = getMultiActions(
                            getSelectedItems,
                            unselectAll,
                        );

                        const actions: Array<IArticleActionBulkExtended> = getBulkActions(
                            articles,
                            multiActions,
                            getSelectedItems,
                            unselectAll,
                            () => {
                                ng.get('$rootScope').$apply();
                            },
                        );

                        return (
                            <ResizeObserverComponent>
                                {(dimensions) => (
                                    <div className="sliding-toolbar sliding-toolbar--static">
                                        <div className="sliding-toolbar__inner">
                                            <Button
                                                text={gettext('Cancel')}
                                                onClick={() => {
                                                    multiSelectOptions.unselectAll();
                                                }}
                                            />
                                            <h4 className="sliding-toolbar__info-text">
                                                {gettextPlural(
                                                    articles.length,
                                                    '1 item selected',
                                                    '{{number}} items selected',
                                                    {number: articles.length},
                                                )}
                                            </h4>
                                        </div>
                                        <div>
                                            <MultiActionBarReact
                                                articles={multiSelectOptions.selected.toArray()}
                                                getCoreActions={() => actions}
                                                compact={dimensions.width < COMPACT_WIDTH}
                                                hideMultiActionBar={() => multiSelectOptions.unselectAll()}
                                            />
                                        </div>
                                    </div>
                                )}
                            </ResizeObserverComponent>
                        );
                    };

                    const header = (itemsCount: number): JSX.Element => {
                        return (
                            <div data-test-id="articles-list--toolbar">
                                <SubNav zIndex={5}>
                                    <div className="space-between">
                                        <h3
                                            className="subnav__page-title sd-flex-no-grow"
                                            data-test-id="articles-list--heading"
                                        >
                                            {this.props.heading}
                                        </h3>
                                        <Badge type="default">{itemsCount}</Badge>
                                    </div>
                                    <div style={{marginLeft: 10, flexGrow: 1}}>
                                        <SearchBar
                                            allowCollapsed={false}
                                            extendOnOpen={false}
                                            onSearch={(fullTextSearch) => {
                                                this.setState({fullTextSearch});
                                            }}
                                            initialValue={this.state.fullTextSearch}
                                        />
                                    </div>

                                    {
                                        extraButtons == null ? null : (
                                            <ButtonGroup padded={true} align="end">
                                                {
                                                    extraButtons.map(({label, onClick}) => (
                                                        <Button
                                                            key={label}
                                                            text={label}
                                                            type="primary"
                                                            onClick={onClick}
                                                        />
                                                    ))
                                                }
                                            </ButtonGroup>
                                        )
                                    }
                                </SubNav>

                                {(() => {
                                    const articles = multiSelectOptions.selected.toArray();

                                    if (articles.length > 0) {
                                        return getMultiSelectToolbar(articles);
                                    } else {
                                        return sortFilterToolbar;
                                    }
                                })()}
                            </div>
                        );
                    };

                    return (
                        <ArticlesListByQuery
                            query={query}
                            onItemClick={this.props.onItemClick}
                            onItemDoubleClick={this.props.onItemDoubleClick}
                            header={header}
                            padding={`${3 / 4 * padding}px ${padding}px`}
                            getMultiSelect={(items) => ({
                                kind: 'new',
                                options: multiSelectOptions,
                                items,
                                MultiSelectComponent: MultiSelect,
                            })}
                        />
                    );
                }}
            </MultiSelectHoc>
        );
    }
}
