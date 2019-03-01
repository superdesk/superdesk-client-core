import {IRestApiResponse, IDefaultApiFields} from '../../types/RestApi';
import React from 'react';
import {connectServices} from './ReactRenderAsync';

export interface ISortOption {
    field: string;
    direction: 'ascending' | 'descending';
}

interface IState<Entity extends IDefaultApiFields> extends IRestApiResponse<Entity> {
    activeFilters: {[fieldName: string]: string};
    activeSortOption?: ISortOption;
}

interface IMethods<Entity extends IDefaultApiFields> {
    read(
        page: number,
        sort?: {
            field: string;
            direction: 'ascending' | 'descending';
        },
        filterValues?: {[fieldName: string]: string},
    ): Promise<IRestApiResponse<Entity>>;
    update(item: Entity): Promise<IRestApiResponse<Entity>>;
    create(item: Entity): Promise<IRestApiResponse<Entity>>;
    delete(item: Entity): Promise<IRestApiResponse<Entity>>;
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
            this.sort = this.sort.bind(this);
            this.removeFilter = this.removeFilter.bind(this);
            this.goToPage = this.goToPage.bind(this);
        }

        create(item: Entity): Promise<IRestApiResponse<Entity>> {
            return this.api.save(item)
                // creating an item impacts sorting/filtering/pagination. Data is re-fetched the page to correct it.
                .then(() => this.read(1, this.state.activeSortOption, this.state.activeFilters));
        }

        read(
            page: number,
            sortOption: ISortOption = {field: 'name', direction: 'ascending'},
            filterValues: {[fieldName: string]: string} = {},
        ): Promise<IRestApiResponse<Entity>> {
            let query = {
                page: page,
            };

            const filtersValidated = Object.keys(filterValues).reduce((accumulator, key) => {
                const value = filterValues[key];

                if (typeof value === 'string') {
                    let trimmedValue = value.trim();

                    if (trimmedValue.length > 1) {
                        accumulator[key] = trimmedValue;
                        return accumulator;
                    } else {
                        return accumulator;
                    }
                } else {
                    accumulator[key] = filterValues[key];
                }
            }, {});

            if (sortOption != null) {
                query['sort'] = (sortOption.direction === 'descending' ? '-' : '') + sortOption.field;
            }

            if (Object.keys(filterValues).length > 0) {
                let filters = {};

                for (let key in filtersValidated) {
                    if (typeof filtersValidated[key] === 'string' && filtersValidated[key].trim().length < 1) {
                        continue;
                    }
                    filters[key] = {
                        "$regex": filtersValidated[key],
                        "$options": "i",
                    };
                }

                query['where'] = filters;
            }

            return this.api.query(query)
                .then((res: IRestApiResponse<Entity>) => {
                    return new Promise((resolve) => {
                        this.setState({
                            ...res,
                            activeSortOption: sortOption,
                            activeFilters: filtersValidated,
                        }, () => {
                            resolve(res);
                        });
                    });
                });
        }

        update(nextItem: Entity): Promise<IRestApiResponse<Entity>> {
            return this.api.save(nextItem)
                // updating an item impacts sorting/filtering/pagination. Data is re-fetched the page to correct it.
                .then(() => this.read(1, this.state.activeSortOption, this.state.activeFilters));
        }

        delete(item: Entity): Promise<IRestApiResponse<Entity>> {
            // items in page will not match with page limit unless refetched
            return this.api.remove(item)
                // updating an item impacts sorting/filtering. Data is re-fetched the page to correct it.
                .then(() => this.read(1, this.state.activeSortOption, this.state.activeFilters));
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
