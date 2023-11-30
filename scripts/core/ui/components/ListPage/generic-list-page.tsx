/* eslint-disable react/no-multi-comp */
/* eslint-disable brace-style */

import React from 'react';
import {noop} from 'lodash';
import ReactPaginate from 'react-paginate';
import classNames from 'classnames';
import {ListItem, ListItemColumn} from 'core/components/ListItem';
import {PageContainer, PageContainerItem} from 'core/components/PageLayout';
import {GenericListPageItemViewEdit} from './generic-list-page-item-view-edit';
import {
    SidePanelHeader,
    SidePanel,
    SidePanelHeading,
    SidePanelTools,
    SidePanelContent,
    SidePanelContentBlock,
    SidePanelFooter,
} from 'core/components/SidePanel';
import {SearchBar} from 'core/ui/components';
import {Button} from 'core/ui/components/Nav';
import {SortBar, ISortFields} from 'core/ui/components/SortBar';
import {TagLabel} from 'core/ui/components/TagLabel';
import {getFormGroupForFiltering} from 'core/ui/components/generic-form/get-form-group-for-filtering';
import {getFormFieldsRecursive, getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {getInitialValues} from '../generic-form/get-initial-values';
import {generateFilterForServer} from '../generic-form/generate-filter-for-server';
import {getFormFieldsFlat} from '../generic-form/get-form-fields-flat';
import {
    IPropsGenericForm,
    IGenericListPageComponent,
    ICrudManager,
    IFormGroup,
    IBaseRestApiResponse,
    ISortOption,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {OnlyWithChildren} from '../only-with-children';
import {connectCrudManagerHttp} from 'core/helpers/crud-manager-http';

interface IState<T> {
    previewItem: T | null;
    editItem: T | null;
    newItem: Partial<T> | null;
    filtersOpen: boolean;
    filterValues: Partial<T>;
    loading: boolean;
    refetchDataScheduled: boolean;
}

export interface IPropsConnected<T> {
    crudManager?: ICrudManager<T>;
}

class DefaultItemsContainerComponent extends React.PureComponent {
    render() {
        return (
            <div
                data-test-id="list-page--items"
                className="sd-list-item-group sd-list-item-group--space-between-items"
            >
                {this.props.children}
            </div>
        );
    }
}

const subNavWrapper: React.ComponentType = (props) => (
    <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
        <div className="subnav">
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}
            >
                {props.children}
            </div>
        </div>
    </div>
);

export class GenericListPageComponent<T, P>
    extends React.Component<IPropsGenericForm<T, P> & IPropsConnected<T>, IState<T>>
    implements IGenericListPageComponent<T>
{
    searchBarRef: SearchBar | null;
    modal: any;
    notify: any;
    $rootScope: any;
    _mounted: boolean;

    constructor(props: IPropsGenericForm<T, P> & IPropsConnected<T>) {
        super(props);

        // preview and edit mode can enabled at the same time, but only one pane will be displayed at once
        // if you start editing from preview mode, you shall return to preview after saving/cancelling the edit
        // if you start editing when preview mode for that item is closed, you shall not see preview after
        // saving/cancelling the edit either.

        this.state = {
            previewItem: null,
            editItem: null,
            newItem: null,
            filtersOpen: false,
            filterValues: props.defaultFilters ? props.defaultFilters : {},
            loading: true,
            refetchDataScheduled: false,
        };

        this.openPreview = this.openPreview.bind(this);
        this.startEditing = this.startEditing.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setFiltersVisibility = this.setFiltersVisibility.bind(this);
        this.handleFilterFieldChange = this.handleFilterFieldChange.bind(this);
        this.openNewItemForm = this.openNewItemForm.bind(this);
        this.closeNewItemForm = this.closeNewItemForm.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.getActiveFilters = this.getActiveFilters.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.getItemsCount = this.getItemsCount.bind(this);
        this.itemIsBeingCreated = this.itemIsBeingCreated.bind(this);
        this.itemIsBeingEdited = this.itemIsBeingEdited.bind(this);

        this.refetchDataUsingCurrentFilters = this.refetchDataUsingCurrentFilters.bind(this);
        this.filter = this.filter.bind(this);

        this.modal = ng.get('modal');
        this.notify = ng.get('notify');
        this.$rootScope = ng.get('$rootScope');
    }

    openPreview(id: string) {
        if (this.state.editItem != null) {
            this.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview while in edit mode',
                ),
            });
        } else if (this.state.newItem != null) {
            this.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview while in create mode',
                ),
            });
        } else if (this.props.crudManager._items.find((value) => this.props.getId(value) === id) != null) {
            const newPreviewItem = this.props.crudManager._items.find((value) => this.props.getId(value) === id);
            // set previewItem only if item with id is available in the props.items._items

            this.setState({
                previewItem: newPreviewItem,
            });
        }
    }

    getActiveFilters() {
        return this.state.filterValues;
    }

    removeFilter(fieldName: string) {
        if (this.props.fieldForSearch != null && this.props.fieldForSearch.field === fieldName) {
            this.searchBarRef.resetSearchValue();
        }

        this.setState((prevState) => ({
            ...prevState,
            filterValues: Object.keys(prevState.filterValues).reduce((acc, key) => {
                if (key !== fieldName) {
                    acc[key] = prevState.filterValues[key];
                }

                return acc;
            }, {}),
        }), () => {
            this.props.crudManager.removeFilter(fieldName);
        });
    }

    getItemsCount() {
        return this.props.crudManager?._items?.length ?? 0;
    }

    deleteItem(item: T) {
        const doDelete = () => this.props.crudManager.delete(item);

        this.modal.confirm(gettext('Are you sure you want to delete this item?'))
            .then(() => {
                if (this.state.editItem != null) {
                    this.modal.alert({
                        headerText: gettext('Warning'),
                        bodyText: gettext(
                            'Edit mode must closed before you can delete an item.',
                        ),
                    });
                } else if (this.state.previewItem != null) {
                    this.setState({
                        previewItem: null,
                    }, doDelete);
                } else {
                    doDelete();
                }
            });
    }

    startEditing(id: string) {
        if (this.state.editItem != null) {
            this.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t edit this item, because another item is in edit mode.',
                ),
            });
        } else {
            const previewItem = (() => {
                if (this.state.previewItem != null && this.props.getId(this.state.previewItem) === id) {
                    return this.state.previewItem;
                }

                return null;
            })();

            const editItem = (() => {
                if (this.state.editItem != null) {
                    return this.state.editItem;
                } else {
                    return this.props.crudManager._items.find((item) => this.props.getId(item) === id);
                }
            })();

            this.setState({
                // reset preview if item in preview mode is different from that editing is being initiated for
                previewItem: previewItem,
                editItem: editItem,
            });
        }
    }

    closePreview() {
        this.setState({
            previewItem: null,
        });
    }

    handleFilterFieldChange(field, nextValue, callback = noop) {
        this.setState((prevState) => {
            if (nextValue == null) {
                return {
                    filterValues: Object.keys(prevState.filterValues)
                        .filter((k) => k !== field)
                        .reduce((accumulator, nextKey) => {
                            accumulator[nextKey] = prevState.filterValues[nextKey];

                            return accumulator;
                        }, {}),
                };
            } else {
                return {
                    filterValues: {
                        ...prevState.filterValues,
                        [field]: nextValue,
                    },
                };
            }
        }, callback);
    }

    validateFilters(filterValues) {
        return Object.keys(filterValues).reduce((accumulator, key) => {
            const value = filterValues[key];

            if (typeof value === 'string') {
                let trimmedValue = value.trim();

                if (trimmedValue.length > 0) {
                    accumulator[key] = trimmedValue;
                }

                return accumulator;
            } else {
                if (value !== undefined) {
                    accumulator[key] = value;
                }

                return accumulator;
            }
        }, {});
    }

    filter() {
        if (this.state.editItem != null) {
            this.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'The item in edit mode must be closed before you can filter.',
                ),
            });
        } else {
            this.refetchDataUsingCurrentFilters();
        }
    }

    refetchDataUsingCurrentFilters() {
        const {filterValues} = this.state;
        const filtersValidated = this.validateFilters(filterValues);

        this.props.crudManager.read(
            1,
            this.props.crudManager.activeSortOption,
            filtersValidated,
        );
    }

    closeNewItemForm() {
        this.setState({newItem: null});
    }

    setFiltersVisibility(nextValue: boolean) {
        this.setState({filtersOpen: nextValue});
    }

    openNewItemForm(initialValues?: {[key: string]: any}) {
        if (this.state.editItem != null || this.state.newItem != null) {
            this.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t add a new item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                newItem: {
                    ...getInitialValues(this.props.getFormConfig()),
                    ...this.props.getNewItemTemplate == null ? {} : this.props.getNewItemTemplate(this),
                    ...(initialValues ?? {}),
                },
                previewItem: null,
            });
        }
    }

    componentDidMount() {
        const filters = this.props.defaultFilters ? this.validateFilters(this.props.defaultFilters) : {};

        this.props.crudManager.read(1, this.props.defaultSortOption, filters);

        if (this.props.refreshOnEvents != null) {
            this.props.refreshOnEvents.forEach((eventName) => {
                this.$rootScope.$on(eventName, () => {
                    // will update the list using selected filtering / sort options
                    this.refetchDataUsingCurrentFilters();
                });
            });
        }
    }

    itemIsBeingEdited() {
        return this.state.editItem != null;
    }

    itemIsBeingCreated() {
        return this.state.newItem != null;
    }

    componentDidUpdate() {
        if (this.state.refetchDataScheduled) {
            this.refetchDataUsingCurrentFilters();
        }
    }

    render() {
        const {additionalProps} = this.props;

        if (this.props.crudManager._items == null) {
            // loading
            return null;
        }

        const {activeFilters} = this.props.crudManager;
        const totalResults = this.props.crudManager._meta.total;
        const pageSize = this.props.crudManager._meta.max_results;
        const pageCount = Math.ceil(totalResults / pageSize);

        const {getFormConfig, ItemComponent} = this.props;
        const ItemsContainerComponent = this.props.ItemsContainerComponent ?? DefaultItemsContainerComponent;

        const formConfigForFilters = getFormGroupForFiltering(this.props.getFormConfig());
        const fieldsList = getFormFieldsRecursive(getFormConfig().form);

        const sortOptions: Array<ISortFields> = [
            ...fieldsList.map(({label, field}) => ({label, field})),
            ...(this.props.additionalSortOptions ?? []),
        ];

        var page: IGenericListPageComponent<T> = {
            openPreview: this.openPreview,
            startEditing: this.startEditing,
            closePreview: this.closePreview,
            setFiltersVisibility: this.setFiltersVisibility,
            handleFilterFieldChange: this.handleFilterFieldChange,
            openNewItemForm: this.openNewItemForm,
            closeNewItemForm: this.closeNewItemForm,
            deleteItem: this.deleteItem,
            getActiveFilters: this.getActiveFilters,
            removeFilter: this.removeFilter,
            getItemsCount: this.getItemsCount,
            itemIsBeingEdited: this.itemIsBeingEdited,
            itemIsBeingCreated: this.itemIsBeingCreated,
        };

        const labelForSaveButton = this.props.labelForItemSaveButton ?? gettext('Save');

        const getContents = () => {
            if (this.props.crudManager._items.length === 0) {
                if (Object.keys(activeFilters).length > 0) {
                    return (
                        <ListItem noHover>
                            <ListItemColumn>
                                {gettext('There are no items matching the search.')}
                            </ListItemColumn>
                        </ListItem>
                    );
                } else {
                    return (
                        <ListItem noHover>
                            <ListItemColumn>
                                {this.props.getNoItemsPlaceholder?.(page) ?? gettext('There are no items yet.')}
                            </ListItemColumn>
                        </ListItem>
                    );
                }
            } else {
                return (
                    <ItemsContainerComponent page={page} additionalProps={additionalProps}>
                        {
                            this.props.crudManager._items.map(
                                (item, i) => (
                                    <ItemComponent
                                        key={this.props.getId(item)}
                                        item={item}
                                        page={page}
                                        inEditMode={this.state.editItem == null ? false : this.props.getId(this.state.editItem) === this.props.getId(item)}
                                        index={i}
                                        getId={this.props.getId}
                                        additionalProps={additionalProps}
                                    />
                                ),
                            )
                        }
                    </ItemsContainerComponent>
                );
            }
        };

        const showPagination = this.props.crudManager._meta.total > this.props.crudManager._items.length;

        return (
            <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
                <OnlyWithChildren wrapper={subNavWrapper}>
                    {
                        this.props.disallowFiltering ? null : (
                            <div>
                                <Button
                                    icon="icon-filter-large"
                                    onClick={() => this.setFiltersVisibility(!this.state.filtersOpen)}
                                    active={this.state.filtersOpen}
                                    darker={true}
                                    data-test-id="toggle-filters"
                                />
                            </div>
                        )
                    }

                    {
                        this.props.fieldForSearch == null ? null : (
                            <div style={{flexGrow: 1}}>
                                <SearchBar
                                    ref={(instance) => {
                                        this.searchBarRef = instance;
                                    }}
                                    value=""
                                    allowCollapsed={false}
                                    onSearch={(value) => {
                                        this.handleFilterFieldChange(
                                            this.props.fieldForSearch.field,
                                            value,
                                            this.filter,
                                        );
                                    }}
                                />
                            </div>
                        )
                    }

                    <OnlyWithChildren style={{display: 'flex', marginLeft: 'auto', gap: '10px', paddingInline: 20}}>
                        {
                            (this.props.hideItemsCount !== true && this.props.crudManager._meta.total != null) && (
                                <span style={{display: 'flex', alignItems: 'center'}}>
                                    <span>{gettext('Total:')}</span>
                                    &nbsp;
                                    <span><span className="badge">{this.props.crudManager._meta.total}</span></span>
                                </span>
                            )
                        }

                        {
                            this.props.disallowSorting !== true && (
                                <SortBar
                                    sortOptions={sortOptions}
                                    selected={this.props.crudManager.activeSortOption}
                                    itemsCount={this.props.crudManager._meta.total}
                                    onSortOptionChange={this.props.crudManager.sort}
                                />
                            )
                        }
                    </OnlyWithChildren>

                    {
                        this.props.disallowCreatingNewItem === true ? null : (
                            <div>
                                <Button
                                    onClick={() => {
                                        this.openNewItemForm();
                                    }}
                                    className="sd-create-btn dropdown-toggle"
                                    icon="icon-plus-large"
                                    data-test-id="list-page--add-item"
                                >
                                    <span className="circle" />
                                </Button>
                            </div>
                        )
                    }
                </OnlyWithChildren>

                <PageContainer>
                    {
                        this.state.filtersOpen ? (
                            <PageContainerItem data-test-id="list-page--filters-form">
                                <SidePanel side="left" width={320}>
                                    <SidePanelHeader>
                                        <SidePanelHeading>{gettext('Refine search')}</SidePanelHeading>
                                        <SidePanelTools>
                                            <button
                                                className="icn-btn"
                                                onClick={() => this.setFiltersVisibility(false)}
                                            >
                                                <i className="icon-close-small" />
                                            </button>
                                        </SidePanelTools>
                                    </SidePanelHeader>
                                    <SidePanelContent>
                                        <SidePanelContentBlock>
                                            <form
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    this.filter();
                                                }}
                                            >
                                                <FormViewEdit
                                                    item={this.state.filterValues}
                                                    formConfig={getFormGroupForFiltering(
                                                        this.props.getFormConfig(this.state.filterValues),
                                                    )}
                                                    editMode={true}
                                                    issues={{}}
                                                    handleFieldChange={this.handleFilterFieldChange}
                                                />

                                            </form>
                                        </SidePanelContentBlock>
                                    </SidePanelContent>
                                    <SidePanelFooter>
                                        <form
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                this.filter();
                                            }}
                                        >
                                            <button
                                                className="btn btn--primary btn--expanded"
                                                type="submit"
                                                data-test-id="filters-submit"
                                            >
                                                {gettext('Filter')}
                                            </button>
                                        </form>

                                    </SidePanelFooter>
                                </SidePanel>
                            </PageContainerItem>
                        ) : null
                    }
                    <PageContainerItem shrink>
                        <div style={{margin: this.props.contentMargin ?? 20}}>
                            {
                                showPagination && (
                                    <div style={{textAlign: 'center', marginTop: -20}}>
                                        <ReactPaginate
                                            previousLabel={gettext('prev')}
                                            nextLabel={gettext('next')}
                                            pageCount={pageCount}
                                            marginPagesDisplayed={2}
                                            pageRangeDisplayed={5}
                                            onPageChange={({selected}) => {
                                                if (this.props.crudManager._meta.page !== (selected + 1)) {
                                                    this.props.crudManager.goToPage(selected + 1);
                                                }
                                            }}
                                            initialPage={this.props.crudManager._meta.page - 1}
                                            containerClassName={'bs-pagination'}
                                            activeClassName="active"
                                        />
                                    </div>
                                )
                            }
                            {
                                Object.keys(activeFilters).length < 1 ? null : (
                                    <div
                                        className="subnav"
                                        style={{background: 'transparent', boxShadow: 'none', marginTop: -20}}
                                        data-test-id="list-page--filters-active"
                                    >
                                        {
                                            Object.keys(activeFilters).map((field_id, i) => {
                                                const currentField = getFormFieldsFlat(formConfigForFilters).find(
                                                    ({field}) => field === field_id,
                                                );

                                                const filterValuePreview = getFormFieldPreviewComponent(
                                                    this.props.crudManager.activeFilters,
                                                    currentField,
                                                );

                                                return (
                                                    <TagLabel
                                                        key={i}
                                                        onRemove={() => {
                                                            this.removeFilter(field_id);
                                                        }}
                                                    >
                                                        {currentField.label}:&nbsp;
                                                        <strong>{filterValuePreview}</strong>
                                                    </TagLabel>
                                                );
                                            })
                                        }
                                    </div>
                                )
                            }
                            {getContents()}
                        </div>
                    </PageContainerItem>

                    {
                        this.state.newItem != null ? (
                            <PageContainerItem data-test-id="list-page--new-item">
                                <GenericListPageItemViewEdit
                                    key="new-item"
                                    operation="creation"
                                    item={this.state.newItem}
                                    getFormConfig={getFormConfig}
                                    editMode={true}
                                    hiddenFields={this.props.hiddenFields ?? []}
                                    onEditModeChange={() => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            newItem: null,
                                        }));
                                    }}
                                    onSave={(item: T) => {
                                        return this.props.crudManager.create(item).then((res) => {
                                            setTimeout(() => {
                                                this.closeNewItemForm();
                                                this.openPreview(this.props.getId(res));
                                                this.refetchDataUsingCurrentFilters();
                                            });
                                        });
                                    }}
                                    onClose={this.closeNewItemForm}
                                    onCancel={this.closeNewItemForm}
                                    labelForSaveButton={labelForSaveButton}
                                />
                            </PageContainerItem>
                        ) : this.state.editItem != null ? (
                            <PageContainerItem data-test-id="list-page--view-edit">
                                <GenericListPageItemViewEdit
                                    key={'edit' + this.props.getId(this.state.editItem)}
                                    operation="editing"
                                    editMode={true}
                                    hiddenFields={this.props.hiddenFields ?? []}
                                    onEditModeChange={(nextValue) => {
                                        if (nextValue === false) {
                                            this.setState((prevState) => ({
                                                ...prevState,
                                                editItem: null,
                                            }));
                                        }
                                    }}
                                    item={this.state.editItem}
                                    getFormConfig={getFormConfig}
                                    onSave={(nextItem) =>
                                        this.props.crudManager.update(this.state.editItem, nextItem)
                                            .then((updatedItem) => {
                                                this.setState((prevState) => ({
                                                    ...prevState,
                                                    editItem: null,
                                                    previewItem: updatedItem,
                                                }));
                                            })
                                    }
                                    onClose={this.closePreview}
                                    labelForSaveButton={labelForSaveButton}
                                />
                            </PageContainerItem>
                        ) : this.state.previewItem != null ? (
                            <PageContainerItem data-test-id="list-page--view-edit">
                                <GenericListPageItemViewEdit
                                    key={'preview' + this.props.getId(this.state.previewItem)}
                                    operation="editing"
                                    editMode={false}
                                    hiddenFields={this.props.hiddenFields ?? []}
                                    onEditModeChange={(nextValue) => {
                                        if (nextValue === true) {
                                            this.setState((prevState) => ({
                                                ...prevState,
                                                previewItem: null,
                                                editItem: prevState.previewItem,
                                            }));
                                        } else {
                                            this.setState((prevState) => ({
                                                ...prevState,
                                                editItem: null,
                                                previewItem: prevState.editItem,
                                            }));
                                        }
                                    }}
                                    item={this.state.previewItem}
                                    getFormConfig={getFormConfig}
                                    onSave={() => {
                                        throw new Error('Can\'t edit in preview mode!');
                                    }}
                                    onClose={this.closePreview}
                                    labelForSaveButton={labelForSaveButton}
                                />
                            </PageContainerItem>
                        ) : null
                    }
                </PageContainer>
            </div>
        );
    }
}

export const getGenericHttpEntityListPageComponent = <T extends IBaseRestApiResponse, P>(
    resource: string,
    formConfig: IFormGroup,
    defaultSortOption?: ISortOption,
    additionalProps?: P,
) => {
    var Component = connectCrudManagerHttp<IPropsGenericForm<T, P>, T>(
        GenericListPageComponent,
        'crudManager',
        resource,
        defaultSortOption,
        (filters: IFormGroup) => {
            const formConfigForFilters = getFormGroupForFiltering(formConfig);
            const fieldTypesLookup = getFormFieldsFlat(formConfigForFilters)
                .reduce((accumulator, item) => ({...accumulator, ...{[item.field]: item.type}}), {});

            let filtersFormatted = {};

            for (let fieldName in filters) {
                filtersFormatted[fieldName] = generateFilterForServer(
                    fieldTypesLookup[fieldName],
                    filters[fieldName],
                );
            }

            return filtersFormatted;
        },
    );

    return class WithAdditionalSortOptions extends React.PureComponent<IPropsGenericForm<T, P>> {
        render() {
            return (
                <Component
                    {...(additionalProps ?? {})}
                    {...this.props}
                    additionalSortOptions={[
                        ...(this.props.additionalSortOptions ?? []),
                        ...[
                            {
                                label: gettext('Last updated'),
                                field: '_updated',
                            },
                            {
                                label: gettext('First created'),
                                field: '_created',
                            },
                        ],
                    ]}
                />
            );
        }
    };
};
