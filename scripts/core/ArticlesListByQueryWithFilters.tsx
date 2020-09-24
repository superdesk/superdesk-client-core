import React from 'react';
import {IArticle} from 'superdesk-api';
import {ISuperdeskQuery, IOrOperator, IAndOperator} from './query-formatting';
import {ArticlesListByQuery} from './ArticlesListByQuery';
import {Set, Map} from 'immutable';
import classNames from 'classnames';
import {gettext} from './utils';

type IFilterValue = string | number;

interface IProps {
    query: ISuperdeskQuery; // TODO: Omit page, max_results?
    onItemClick(item: IArticle): void;
    onItemDoubleClick(item: IArticle): void;
}

interface IState {
    activeFilters: Map<string, Set<IFilterValue>>;
    fullTextSearch: string;
}

function getQueryWithFilters(
    originalQuery: ISuperdeskQuery,
    filters: IState['activeFilters'],
    fullTextSearch: string,
): ISuperdeskQuery {
    if (filters.size < 1) {
        if (fullTextSearch?.length < 1) {
            return originalQuery;
        } else {
            return {
                ...originalQuery,
                fullTextSearch,
            };
        }
    }

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

    const r = {
        ...originalQuery,
        filter: {
            $and: [
                originalQuery.filter,
                filtersQuery.$and.length > 1 ? filtersQuery : filtersQuery.$and[0],
            ],
        },
    };

    if ((fullTextSearch?.length ?? 0) > 0) {
        r.fullTextSearch = fullTextSearch;
    }

    return r;
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

        this.setState({
            activeFilters: value == null
                ? activeFilters.remove(key)
                : activeFilters.set(key, filter.remove(value)),
        });
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
        return (
            <React.Fragment>
                <div>
                    <input
                        type="text"
                        value={this.state.fullTextSearch}
                        onChange={(e) => {
                            this.setState({
                                fullTextSearch: e.target.value.trim(),
                            });
                        }}
                    />
                </div>
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
                <ArticlesListByQuery
                    query={getQueryWithFilters(this.props.query, this.state.activeFilters, this.state.fullTextSearch)}
                    onItemClick={this.props.onItemClick}
                    onItemDoubleClick={this.props.onItemDoubleClick}
                />
            </React.Fragment>
        );
    }
}
