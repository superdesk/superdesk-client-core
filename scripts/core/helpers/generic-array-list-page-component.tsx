import React from 'react';
import {
    ICrudManagerFilters,
    ICrudManagerMethods,
    ISortOption,
    ICrudManagerData,
    IPropsGenericArrayListPage,
} from 'superdesk-api';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {omit} from 'lodash';
import {gettext} from 'core/utils';

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

export class GenericArrayListPageComponent<T, P>
    extends React.Component<IPropsGenericArrayListPage<T, P>, IState>
    implements ICrudManagerMethods<T> {
    constructor(props: IPropsGenericArrayListPage<T, P>) {
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

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(value: Array<T>) {
        this.props.onChange(value);
    }

    create(item: T): Promise<T> {
        const i = this.props.newItemIndex ?? this.props.value.length;

        const result: Array<T> = [
            ...this.props.value.slice(0, i),
            item,
            ...this.props.value.slice(i),
        ];

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
    ): Promise<ICrudManagerData<T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    update(_item: T, nextItem: T): Promise<T> {
        this.handleChange(this.props.value.map(
            (item) => this.props.getId(item) === this.props.getId(nextItem) ? nextItem : item),
        );

        return Promise.resolve(nextItem);
    }

    delete(item: T): Promise<void> {
        this.handleChange(this.props.value.filter((current) => this.props.getId(current) !== this.props.getId(item)));

        return Promise.resolve();
    }

    refresh(): Promise<ICrudManagerData<T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    sort(sortOption: ISortOption): Promise<ICrudManagerData<T>> {
        return Promise.resolve(getItemsWithMeta(this.props.value));
    }

    removeFilter(fieldName: string): Promise<ICrudManagerData<T>> {
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
                {...omit(this.props, ['value', 'onChange', 'newItemIndex'])} // omit own props
                labelForItemSaveButton={gettext('Apply')}
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
