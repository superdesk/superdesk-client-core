import {IRestApiResponse, IDefaultApiFields} from '../../types/RestApi';
import React from 'react';
import {connectServices} from './ReactRenderAsync';

export interface ISortOption {
    field: string;
    direction: 'ascending' | 'descending';
}

export type ICrudManagerFilters = {[fieldName: string]: any};

interface IState<Entity extends IDefaultApiFields> extends IRestApiResponse<Entity> {
    activeFilters: ICrudManagerFilters;
    activeSortOption?: ISortOption;
}

interface IMethods<Entity extends IDefaultApiFields> {
    read(
        page: number,
        sort?: {
            field: string;
            direction: 'ascending' | 'descending';
        },
        filterValues?: ICrudManagerFilters,
        formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
    ): Promise<IRestApiResponse<Entity>>;
    update(item: Entity): Promise<Entity>;
    create(item: Entity): Promise<Entity>;
    delete(item: Entity): Promise<void>;
    refresh(): Promise<IRestApiResponse<Entity>>;
    sort(nextSortOption: ISortOption): Promise<IRestApiResponse<Entity>>;
    removeFilter(fieldName: string): Promise<IRestApiResponse<Entity>>;
    goToPage(nextPage: number): Promise<IRestApiResponse<Entity>>;
}

export interface ICrudManager<Entity extends IDefaultApiFields> extends IState<Entity>, IMethods<Entity> {
    // allow exposing it as one interface for consumer components
}

export function connectCrudManager<Props, Entity extends IDefaultApiFields>(
    WrappedComponent: React.ComponentType<Props>,
    name: string,
    endpoint: string,
) {
    const component = class extends React.Component<Props, IState<Entity>> implements IMethods<Entity> {
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
            return this.api.save(item).then((res) => this.refresh().then(() => res));
        }

        read(
            page: number,
            sortOption: ISortOption = {field: 'name', direction: 'ascending'},
            filterValues: ICrudManagerFilters = {},
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<Entity>> {
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

            return this.api.query(query)
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
            // updating an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return this.api.save(nextItem).then((res) => this.refresh().then(() => res));
        }

        delete(item: Entity): Promise<void> {
            // deleting an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return this.api.remove(item).then(() => this.refresh().then(() => undefined));
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
