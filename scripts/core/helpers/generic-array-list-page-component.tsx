import React from 'react';
import {
    ICrudManagerFilters,
    ICrudManagerMethods,
    ISortOption,
    IWithIdentifier,
    ICrudManagerResponse,
    IPropsGenericArrayListPage,
} from 'superdesk-api';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {omit} from 'lodash';

interface IState {
    activeSortOption: ISortOption;
    activeFilters: {};
}

function computeMeta(items) {
    const itemsCount = items.length;

    return {
        total: itemsCount,
        max_results: itemsCount,
        page: 1,
    };
}

function getItemsWithMeta(_items) {
    return {
        _items: _items,
        _meta: computeMeta(_items),
    };
}

export class GenericArrayListPageComponent<T extends IWithIdentifier>
    extends React.Component<IPropsGenericArrayListPage<T>, IState>
    implements ICrudManagerMethods<IWithIdentifier, T> {
    private lastId: number;
    constructor(props: IPropsGenericArrayListPage<T>) {
        super(props);

        this.state = {
            activeSortOption: props.defaultSortOption,
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

        this.addId = this.addId.bind(this);
        this.handleChange = this.handleChange.bind(this);

        this.lastId = 0;
    }

    addId(item: T): T & IWithIdentifier {
        return {...item, _id: (++this.lastId).toString()};
    }

    handleChange(value: Array<T & IWithIdentifier>) {
        this.props.onChange(value);
    }

    create(item: T): Promise<T> {
        const result: Array<T> = [...this.props.value, this.addId(item)];

        return new Promise((resolve) => {
            resolve(item);

            setTimeout(() => {
                this.handleChange(result);
            });
        });
    }

    read(
        page: number,
        sort: ISortOption,
        filterValues?: ICrudManagerFilters,
    ): Promise<ICrudManagerResponse<IWithIdentifier, T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    update(nextItem: T): Promise<T> {
        this.handleChange(this.props.value.map((item) => item._id === nextItem._id ? nextItem : item));

        return Promise.resolve(nextItem);
    }

    delete(item: T): Promise<void> {
        this.handleChange(this.props.value.filter((current) => current._id !== item._id));

        return Promise.resolve();
    }

    refresh(): Promise<ICrudManagerResponse<IWithIdentifier, T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    sort(sortOption: ISortOption): Promise<ICrudManagerResponse<IWithIdentifier, T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    removeFilter(fieldName: string): Promise<ICrudManagerResponse<IWithIdentifier, T>> {
        let nextFilters = {...this.state.activeFilters};

        delete nextFilters[fieldName];

        return this.read(1, this.state.activeSortOption, nextFilters);
    }

    goToPage(nextPage: number) {
        return this.read(nextPage, this.props.defaultSortOption, this.state.activeFilters);
    }

    render() {
        return (
            <GenericListPageComponent
                {...omit(this.props, ['value', 'onChange'])} // omit own props
                crudManager={{
                    read: this.read,
                    update: this.update,
                    create: this.create,
                    delete: this.delete,
                    refresh: this.refresh,
                    sort: this.sort,
                    removeFilter: this.removeFilter,
                    goToPage: this.goToPage,
                    activeFilters: {},
                    activeSortOption: this.props.defaultSortOption,
                    _items: this.props.value,
                    _meta: computeMeta(this.props.value),
                }}
            />
        );
    }
}
