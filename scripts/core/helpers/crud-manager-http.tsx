import React from 'react';
import {
    IBaseRestApiResponse,
    ICrudManagerFilters,
    ICrudManagerState,
    ICrudManagerMethods,
    ISortOption,
    IRestApiResponse,
} from 'superdesk-api';
import ng from 'core/services/ng';
import {dataApi} from './CrudManager';
import {notify} from 'core/notify/notify';
import {gettext} from 'core/utils';

export function connectCrudManagerHttp<Props, Entity extends IBaseRestApiResponse>(
    // type stoped working after react 16.8 upgrade. See if it's fixed by a future React types or TypeScript update
    WrappedComponent, // : React.ComponentType<Props & PropsToConnect>
    name: string,
    endpoint: string,
    defaultSortOption: ISortOption,
    formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
): React.ComponentType<Props> {
    return class CrudManagerHttp extends React.Component<Props, ICrudManagerState<Entity>>
        implements ICrudManagerMethods<Entity> {
        api: any;

        constructor(props) {
            super(props);

            this.api = ng.get('api')(endpoint);

            this.state = {
                _items: null,
                _meta: null,
                activeSortOption: defaultSortOption ?? null,
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
            return dataApi.create<Entity>(endpoint, item).then((res) => this.refresh().then(() => {
                notify.success(gettext('The item has been created.'));

                return res;
            }));
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
                .then((res) => this.refresh().then(() => {
                    notify.success(gettext('The item has been updated.'));

                    return res;
                }));
        }

        delete(item: Entity): Promise<void> {
            // deleting an item impacts sorting/filtering/pagination. Data is re-fetched to correct it.
            return dataApi.delete(endpoint, item)
                .then(() => this.refresh())
                .then(() => {
                    notify.success(gettext('The item has been deleted.'));
                })
                .catch((reason) => {
                    if (reason != null && reason.message != null) {
                        notify.error(reason.message);
                        return;
                    }

                    return Promise.reject(reason);
                });
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
}
