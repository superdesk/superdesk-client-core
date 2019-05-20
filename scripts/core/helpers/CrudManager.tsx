/* eslint-disable react/display-name */

import React from 'react';
import {generate} from 'json-merge-patch';
import {connectServices} from './ReactRenderAsync';
import ng from 'core/services/ng';
import {
    IBaseRestApiResponse,
    ICrudManagerState,
    ICrudManagerMethods,
    ISortOption,
    ICrudManagerFilters,
    IRestApiResponse,
    IDataApi,
} from 'superdesk-api';

export const dataApi: IDataApi = {
    create: (endpoint, item) => ng.getService('api').then((api) => api(endpoint).save(item)),
    query: (
        endpoint: string,
        page: number,
        sortOption: ISortOption,
        filterValues: ICrudManagerFilters = {},
        formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
    ) => ng.getService('api').then((api) => {
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

        return api(endpoint).query(query);
    }),
    patch: (endpoint, item1, item2) => ng.getService('api').then((api) => {
        const patch = generate(item1, item2);

        return api(endpoint).save(item1, patch);
    }),
    delete: (endpoint, item) => ng.getService('api').then((api) => api(endpoint).remove(item)),
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
