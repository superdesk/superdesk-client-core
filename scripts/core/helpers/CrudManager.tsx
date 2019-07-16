/* eslint-disable react/display-name */

import React from 'react';
import {generate} from 'json-merge-patch';
import {connectServices} from './ReactRenderAsync';
import {
    IBaseRestApiResponse,
    ICrudManagerState,
    ICrudManagerMethods,
    ISortOption,
    ICrudManagerFilters,
    IRestApiResponse,
    IDataApi,
} from 'superdesk-api';
import {isObject} from 'lodash';
import {httpRequestJsonLocal} from './network';

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

        const queryString = '?' + Object.keys(query).map((key) =>
            `${key}=${isObject(query[key]) ? JSON.stringify(query[key]) : query[key]}`).join('&');

        return httpRequestJsonLocal({
            'method': 'GET',
            path: '/' + endpoint + queryString,
        });
    },
    patch: (endpoint, item1, item2) => {
        const patch = generate(item1, item2);

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

        return httpRequestJsonLocal({
            'method': 'PATCH',
            path: '/' + endpoint + '/' + item1._id,
            payload: patch,
            headers: {
                'If-Match': item1._etag,
            },
        });
    },
    delete: (endpoint, item) => httpRequestJsonLocal({
        'method': 'DELETE',
        path: '/' + endpoint + '/' + item._id,
        headers: {
            'If-Match': item._etag,
        },
    }),
};

export function connectCrudManager<Props, PropsToConnect, Entity extends IBaseRestApiResponse>(
    WrappedComponent: React.ComponentType<Props & PropsToConnect>,
    name: string,
    endpoint: string,
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
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<Entity>> {
            return dataApi.query(
                endpoint,
                page,
                sortOption,
                filterValues,
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
            return this.read(1, this.state.activeSortOption, this.state.activeFilters);
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
