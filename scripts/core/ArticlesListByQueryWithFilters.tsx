/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticle, ISortOption} from 'superdesk-api';
import {ISuperdeskQuery, IOrOperator, IAndOperator} from './query-formatting';
import {ArticlesListByQuery} from './ArticlesListByQuery';
import {Set, Map} from 'immutable';
import classNames from 'classnames';
import {gettext, gettextPlural} from './utils';
import {getArticleSortOptions} from 'apps/search/services/SearchService';
import {SearchBar} from './ui/components';
import {SortBar} from './ui/components/SortBar';
import {Badge} from './ui/components/Badge';
import {IMultiSelectOptions, MultiSelectHoc} from './MultiSelectHoc';
import {SelectBoxWithoutMutation} from 'apps/search/components/SelectBox';
import {TypeIcon} from 'apps/search/components';
import {IArticleActionBulkExtended, MultiActionBarReact} from 'apps/monitoring/MultiActionBarReact';
import {getMultiActions} from 'apps/search/controllers/get-multi-actions';
import {Button} from 'superdesk-ui-framework';
import ng from 'core/services/ng';

class MultiSelect extends React.Component<{item: IArticle; options: IMultiSelectOptions}> {
    render() {
        const {item, options} = this.props;

        const checkbox = (
            <SelectBoxWithoutMutation
                item={item}
                onSelect={(id) => {
                    options.toggle(item);
                }}
                selected={options.selected.has(item._id)}
                className="hover-AB--B"
            />
        );

        return (
            <div
                className="list-field type-icon"
                data-test-id="multi-select-checkbox"
            >
                {
                    options.selected.has(item._id)
                        ? checkbox
                        : (
                            <div className="hover-AB">
                                <div className="hover-AB--A" style={{display: 'flex'}}>
                                    <TypeIcon
                                        type={item.type}
                                        highlight={item.highlight}
                                    />
                                </div>
                                {checkbox}
                            </div>
                        )
                }
            </div>
        );
    }
}

type IFilterValue = string | number;

interface IProps {
    heading: string;
    query: ISuperdeskQuery;
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
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

function getItemTypes() {
    return [
        {type: 'text', label: gettext('text')},
        {type: 'picture', label: gettext('picture')},
        {type: 'graphic', label: gettext('graphic')},
        {type: 'composite', label: gettext('package')},
        {type: 'highlight-pack', label: gettext('highlights package')},
        {type: 'video', label: gettext('video')},
        {type: 'audio', label: gettext('audio')},
    ];
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

        /**
         * When multi-select is started, filter/sort bar disappears and multi-select toolbar appears.
         * Height is hardcoded in order for the position of all items to remain the same.
         */
        const toolbar2Height = 50;

        const sortFilterToolbar = (
            <div
                style={{
                    display: 'flex',
                    height: toolbar2Height,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #d5d5d5',
                    borderBottom: '1px solid #d5d5d5',
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingLeft: padding,
                    paddingRight: padding,
                }}
            >
                <div>
                    <div className="button-list">
                        <button
                            className={classNames(
                                'toggle-button',
                                {'toggle-button--active': this.hasFilter('type') === false},
                            )}
                            onClick={() => {
                                this.removeFilter('type');
                            }}
                        >
                            {gettext('All')}
                        </button>
                        {getItemTypes().map(({type, label}) => (
                            <button
                                key={type}
                                className={classNames(
                                    'toggle-button',
                                    {'toggle-button--active': this.hasFilter('type', type)},
                                )}
                                onClick={() => {
                                    this.toggleFilter('type', type);
                                }}
                                aria-label={label}
                            >
                                <i className={`toggle-button__icon filetype-icon-${type}`} />
                            </button>
                        ))}
                    </div>
                </div>
                <SortBar
                    sortOptions={getArticleSortOptions()}
                    selected={this.state.sortOption}
                    onSortOptionChange={(sortOption) => {
                        this.setState({sortOption});
                    }}
                />
            </div>
        );

        return (
            <MultiSelectHoc>
                {(multiSelectOptions) => {
                    const getMultiSelectToolbar = (articles: Array<IArticle>) => {
                        const multiActions = getMultiActions(
                            () => articles,
                            () => multiSelectOptions.unselectAll(),
                        );

                        // TODO: Port everything from MultiActionBar.ts to react.
                        const actions: Array<IArticleActionBulkExtended> = [];

                        if (articles.every(({state}) => state === 'spiked')) {
                            actions.push({
                                label: gettext('Unspike'),
                                icon: 'icon-unspike',
                                onTrigger: () => {
                                    multiActions.unspikeItems();
                                    ng.get('$rootScope').$apply();
                                },
                                canAutocloseMultiActionBar: false,
                            });
                        }

                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    height: toolbar2Height,
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#d2e5ed',
                                    paddingLeft: padding,
                                    paddingRight: padding,
                                }}
                            >
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    <Button
                                        text={gettext('Cancel')}
                                        onClick={() => {
                                            multiSelectOptions.unselectAll();
                                        }}
                                    />
                                    <h4 style={{marginLeft: 20}}>
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
                                        compact={false}
                                        hideMultiActionBar={() => multiSelectOptions.unselectAll()}
                                    />
                                </div>
                            </div>
                        );
                    };

                    const header = (itemsCount: number): JSX.Element => {
                        return (
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: padding,
                                        paddingRight: padding,
                                    }}
                                >
                                    <div className="space-between">
                                        <h3
                                            className="subnav__page-title sd-flex-no-grow"
                                            style={{padding: 0, marginRight: 10}}
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
                                </div>

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
                            query={getQueryWithFilters(
                                this.props.query,
                                this.state.activeFilters,
                                this.state.fullTextSearch,
                                this.state.sortOption,
                            )}
                            onItemClick={this.props.onItemClick}
                            onItemDoubleClick={this.props.onItemDoubleClick}
                            header={header}
                            padding={`${3 / 4 * padding}px ${padding}px`}
                            multiSelect={{
                                kind: 'new',
                                options: multiSelectOptions,
                                MultiSelectComponent: MultiSelect,
                            }}
                        />
                    );
                }}
            </MultiSelectHoc>
        );
    }
}
