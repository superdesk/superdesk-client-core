/* eslint-disable react/display-name */
import {appConfig} from 'appConfig';
import ng from 'core/services/ng';
import {generate} from 'json-merge-patch';
import {isObject} from 'lodash';
import React from 'react';
import {
    IBaseRestApiResponse,
    ICrudManagerState,
    ICrudManagerMethods,
    ISortOption,
    ICrudManagerFilters,
    IRestApiResponse,
    IDataApi,
    IQueryElasticParameters,
    IArticleQueryResult,
    IArticleQuery,
    IArticle,
} from 'superdesk-api';
import {httpRequestJsonLocal, httpRequestVoidLocal} from './network';
import {connectServices} from './ReactRenderAsync';

export function queryElastic(
    parameters: IQueryElasticParameters,
) {
    const {endpoint, page, sort, filterValues, aggregations} = parameters;

    return ng.getServices(['session', 'api'])
        .then((res: any) => {
            const [session] = res;

            const source = {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: Object.keys(filterValues).map((key) => ({terms: {[key]: filterValues[key]}})),
                                must_not: [
                                    {term: {state: 'spiked'}},
                                    {term: {package_type: 'takes'}},
                                ],
                                should: [
                                    {
                                        bool: {
                                            must: [
                                                {term: {state: 'draft'}},
                                                {term: {original_creator: session.identity._id}},
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            must_not: [
                                                {term: {state: 'draft'}},
                                            ],
                                        },
                                    },
                                ],
                                minimum_should_match: 1,
                            },
                        },
                    },
                },
                sort: sort,
                size: page.size,
                from: page.from,
            };

            const query = {
                aggregations: aggregations === true ? 1 : 0,
                es_highlight: 0,
                // projections: [],
                source,
            };

            const queryString = '?' + Object.keys(query).map((key) =>
                `${key}=${isObject(query[key]) ? JSON.stringify(query[key]) : encodeURIComponent(query[key])}`,
            ).join('&');

            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', appConfig.server.url + '/' + endpoint + queryString, true);

                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', session.token);

                xhr.onload = function() {
                    resolve(JSON.parse(this.responseText));
                };

                xhr.send();
            });
        });
}

export const dataApiByEntity = {
    article: {
        query: (parameters: IArticleQuery): Promise<IArticleQueryResult> =>
            queryElastic({...parameters, endpoint: 'search'}) as Promise<IArticleQueryResult>,
    },
};

export function generatePatch<T extends IBaseRestApiResponse>(item1: T, item2: T): Partial<T> {
    const patch: Partial<T> = generate(item1, item2);

    // due to the use of "projections"(partial entities) item2 is sometimes missing fields which item1 has
    // which is triggering patching algorithm to think we want to set those missing fields to null
    // the below code enforces that in order to patch to contain null,
    // item2 must explicitly send nulls instead of missing fields
    for (const key in patch) {
        if (patch[key] === null && item2[key] !== null) {
            delete patch[key];
        }
    }

    // remove IBaseRestApiResponse fields
    delete patch['_created'];
    delete patch['_updated'];
    delete patch['_id'];
    delete patch['_etag'];
    delete patch['_links'];

    return patch;
}

export function generatePatchIArticle(a: IArticle, b: IArticle) {
    const patch = generatePatch(a, b);

    delete patch['es_highlight'];

    return patch;
}

export const dataApi: IDataApi = {
    findOne: (endpoint, id) => httpRequestJsonLocal({
        method: 'GET',
        path: '/' + endpoint + '/' + id,
    }),
    create: (endpoint, item) => httpRequestJsonLocal({
        'method': 'POST',
        path: '/' + endpoint,
        payload: item,
    }),
    query: (
        endpoint: string,
        page: number,
        sortOption: ISortOption,
        filterValues: ICrudManagerFilters = {},
        max_results?: number,
        formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
    ) => {
        let query = {
            page: page,
        };

        if (sortOption != null) {
            query['sort'] = (sortOption.direction === 'descending' ? '-' : '') + sortOption.field;
        }

        if (Object.keys(filterValues).length > 0) {
            query['where'] = typeof formatFiltersForServer === 'function'
                ? formatFiltersForServer(filterValues)
                : filterValues;
        }

        if (typeof max_results === 'number') {
            query['max_results'] = max_results;
        }

        const queryString = '?' + Object.keys(query).map((key) =>
            `${key}=${isObject(query[key]) ? JSON.stringify(query[key]) : encodeURIComponent(query[key])}`).join('&');

        return httpRequestJsonLocal({
            'method': 'GET',
            path: '/' + endpoint + queryString,
        });
    },
    patch: (endpoint, item1, item2) => {
        const patch = generatePatch(item1, item2);

        return httpRequestJsonLocal({
            'method': 'PATCH',
            path: '/' + endpoint + '/' + item1._id,
            payload: patch,
            headers: {
                'If-Match': item1._etag,
            },
        });
    },
    patchRaw: (endpoint, id, etag, patch) => {
        return httpRequestJsonLocal({
            'method': 'PATCH',
            path: '/' + endpoint + '/' + id,
            payload: patch,
            headers: {
                'If-Match': etag,
            },
        });
    },
    delete: (endpoint, item) => httpRequestVoidLocal({
        method: 'DELETE',
        path: '/' + endpoint + '/' + item._id,
        headers: {
            'If-Match': item._etag,
        },
    }),
};

export function connectCrudManager<Props, PropsToConnect, Entity extends IBaseRestApiResponse>(
    // type stoped working after react 16.8 upgrade. See if it's fixed by a future React types or TypeScript update
    WrappedComponent, // : React.ComponentType<Props & PropsToConnect>
    name: string,
    endpoint: string,
    formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
): React.ComponentType<Props> {
    const component = class extends React.Component<Props, ICrudManagerState<Entity>>
        implements ICrudManagerMethods<Entity> {
        api: any;

        constructor(props) {
            super(props);

            this.api = props.api(endpoint);

            this.state = {
                _items: null,
                _meta: null,
                _links: null,
                activeSortOption: null,
                activeFilters: {},
            };

            this.create = this.create.bind(this);
            this.read = this.read.bind(this);
            this.update = this.update.bind(this);
            this.delete = this.delete.bind(this);
            this.refresh = this.refresh.bind(this);
            this.sort = this.sort.bind(this);
            this.removeFilter = this.removeFilter.bind(this);
            this.goToPage = this.goToPage.bind(this);
        }

        create(item: Entity): Promise<Entity> {
            // creating an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return dataApi.create<Entity>(endpoint, item).then((res) => this.refresh().then(() => res));
        }

        read(
            page: number,
            sortOption: ISortOption,
            filterValues: ICrudManagerFilters = {},
        ): Promise<IRestApiResponse<Entity>> {
            return dataApi.query(
                endpoint,
                page,
                sortOption,
                filterValues,
                undefined,
                formatFiltersForServer,
            )
                .then((res: IRestApiResponse<Entity>) => new Promise((resolve) => {
                    this.setState({
                        ...res,
                        activeSortOption: sortOption,
                        activeFilters: filterValues,
                    }, () => {
                        resolve(res);
                    });
                }));
        }

        update(nextItem: Entity): Promise<Entity> {
            const currentItem = this.state._items.find(({_id}) => _id === nextItem._id);

            // updating an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return dataApi.patch<Entity>(endpoint, currentItem, nextItem)
                .then((res) => this.refresh().then(() => res));
        }

        delete(item: Entity): Promise<void> {
            // deleting an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return dataApi.delete(endpoint, item).then(() => this.refresh().then(() => undefined));
        }

        refresh(): Promise<IRestApiResponse<Entity>> {
            return this.read(this.state._meta.page, this.state.activeSortOption, this.state.activeFilters);
        }

        sort(sortOption: ISortOption): Promise<IRestApiResponse<Entity>> {
            return this.read(1, sortOption);
        }

        removeFilter(fieldName: string): Promise<IRestApiResponse<Entity>> {
            let nextFilters = {...this.state.activeFilters};

            delete nextFilters[fieldName];

            return this.read(1, this.state.activeSortOption, nextFilters);
        }

        goToPage(nextPage: number) {
            return this.read(nextPage, this.state.activeSortOption, this.state.activeFilters);
        }

        render() {
            // workaround for typescript bug
            // https://github.com/Microsoft/TypeScript/issues/28748#issuecomment-450497274
            const fixedProps = this.props as any;

            return (
                <WrappedComponent
                    {
                    ...{
                        [name]: {
                            ...this.state,
                            create: this.create,
                            read: this.read,
                            update: this.update,
                            delete: this.delete,
                            sort: this.sort,
                            removeFilter: this.removeFilter,
                            goToPage: this.goToPage,
                        },
                    }
                    }
                    {...fixedProps}
                />
            );
        }
    };

    return connectServices(component, ['api']);
}
