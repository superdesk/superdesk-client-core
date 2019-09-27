/* eslint-disable brace-style */

import React from 'react';
import {noop} from 'lodash';
import ReactPaginate from 'react-paginate';

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
} from 'core/components/SidePanel';
import {SearchBar} from 'core/ui/components';
import {Button} from 'core/ui/components/Nav';
import {SortBar, ISortFields} from 'core/ui/components/SortBar';
import {connectCrudManager} from 'core/helpers/CrudManager';
import {TagLabel} from 'core/ui/components/TagLabel';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {getFormGroupForFiltering} from 'core/ui/components/generic-form/get-form-group-for-filtering';
import {getFormFieldsRecursive, getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {getInitialValues} from '../generic-form/get-initial-values';
import {generateFilterForServer} from '../generic-form/generate-filter-for-server';
import {getFormFieldsFlat} from '../generic-form/get-form-fields-flat';
import {
    IBaseRestApiResponse,
    IPropsGenericForm,
    IGenericListPageComponent,
    ICrudManagerFilters,
    ICrudManager,
} from 'superdesk-api';

interface IState {
    previewItemId: string | null;
    editItemId: string | null;
    newItem: {[key: string]: any} | null;
    filtersOpen: boolean;
    filterValues: {[key: string]: any};
    loading: boolean;
    refetchDataScheduled: boolean;
}

interface IPropsConnected<T extends IBaseRestApiResponse> {
    items?: ICrudManager<T>;
    modal: any;
    notify: any;
    $rootScope: any;
}

export class GenericListPageComponent<T extends IBaseRestApiResponse>
    extends React.Component<IPropsGenericForm<T> & IPropsConnected<T>, IState>
    implements IGenericListPageComponent<T>
{
    searchBarRef: SearchBar | null;

    constructor(props: IPropsGenericForm<T> & IPropsConnected<T>) {
        super(props);

        // preview and edit mode can enabled at the same time, but only one pane will be displayed at once
        // if you start editing from preview mode, you shall return to preview after saving/cancelling the edit
        // if you start editing when preview mode for that item is closed, you shall not see preview after
        // saving/cancelling the edit either.

        this.state = {
            previewItemId: null,
            editItemId: null,
            newItem: null,
            filtersOpen: false,
            filterValues: props.defaultFilters ? props.defaultFilters : {},
            loading: true,
            refetchDataScheduled: false,
        };

        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setFiltersVisibility = this.setFiltersVisibility.bind(this);
        this.handleFilterFieldChange = this.handleFilterFieldChange.bind(this);
        this.openNewItemForm = this.openNewItemForm.bind(this);
        this.closeNewItemForm = this.closeNewItemForm.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.refetchDataUsingCurrentFilters = this.refetchDataUsingCurrentFilters.bind(this);
        this.filter = this.filter.bind(this);
    }
    openPreview(id) {
        if (this.state.editItemId != null) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview while in edit mode',
                ),
            });
        } else if (this.state.newItem != null) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview while in create mode',
                ),
            });
        } else {
            this.setState({
                previewItemId: id,
            });
        }
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
            this.props.items.removeFilter(fieldName);
        });
    }
    deleteItem(item: T) {
        const deleteNow = () => this.props.items.delete(item).then(() => {
            this.props.notify.success(gettext('The item has been deleted.'));
        });

        this.props.modal.confirm(gettext('Are you sure you want to delete this item?'))
            .then(() => {
                if (this.state.editItemId != null) {
                    this.props.modal.alert({
                        headerText: gettext('Warning'),
                        bodyText: gettext(
                            'Edit mode must closed before you can delete an item.',
                        ),
                    });
                } else if (this.state.previewItemId != null) {
                    this.setState({
                        previewItemId: null,
                    }, deleteNow);
                } else {
                    deleteNow();
                }
            });
    }
    startEditing(id: string) {
        if (this.state.editItemId != null) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t edit this item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                // reset preview if item in preview mode is different from that
                // editing is being initiated for
                previewItemId: this.state.previewItemId === id ? id : null,
                editItemId: id,
            });
        }
    }
    closePreview() {
        this.setState({
            previewItemId: null,
        });
    }
    handleFilterFieldChange(field, nextValue, callback = noop) {
        this.setState((prevState) => ({
            filterValues: {
                ...prevState.filterValues,
                [field]: nextValue,
            },
        }), callback);
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
        if (this.state.editItemId != null) {
            this.props.modal.alert({
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
        const execute = () => {
            const {filterValues} = this.state;
            const formConfigForFilters = getFormGroupForFiltering(this.props.formConfig);
            const fieldTypesLookup = getFormFieldsFlat(formConfigForFilters)
                .reduce((accumulator, item) => ({...accumulator, ...{[item.field]: item.type}}), {});
            const filtersValidated = this.validateFilters(filterValues);

            this.props.items.read(
                1,
                this.props.items.activeSortOption,
                filtersValidated,
                (filters: ICrudManagerFilters) => {
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
        };

        if (this.state.editItemId != null) {
            /*  If refetch is requested while an item is being edited,
                schedule that update until after the editing view is closed.

                A warning used to be shown at this point but produced incorrect results
                because after a user presses "save", editing view can't be closed immediately.
                It needs to wait for a success response from the server. This code executes sooner
                than the editing view checks the response code and closes itself.
            */

            this.setState({refetchDataScheduled: true});
        } else if (this.state.previewItemId != null) {
            this.setState({
                previewItemId: null,
            }, execute);
        } else {
            execute();
        }
    }
    closeNewItemForm() {
        this.setState({newItem: null});
    }
    setFiltersVisibility(nextValue: boolean) {
        this.setState({filtersOpen: nextValue});
    }
    openNewItemForm() {
        if (this.state.editItemId != null) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t add a new item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                newItem: {
                    ...getInitialValues(this.props.formConfig),
                    ...this.props.newItemTemplate == null ? {} : this.props.newItemTemplate,
                },
                previewItemId: null,
            });
        }
    }
    componentDidMount() {
        const filters = this.props.defaultFilters ? this.validateFilters(this.props.defaultFilters) : {};

        this.props.items.read(1, this.props.defaultSortOption, filters);

        if (this.props.refreshOnEvents != null) {
            this.props.refreshOnEvents.forEach((eventName) => {
                this.props.$rootScope.$on(eventName, () => {
                    // will update the list using selected filtering / sort options
                    this.refetchDataUsingCurrentFilters();
                });
            });
        }
    }
    componentDidUpdate() {
        if (this.state.refetchDataScheduled && this.state.editItemId == null) {
            this.refetchDataUsingCurrentFilters();
        }
    }
    render() {
        if (this.props.items._items == null) {
            // loading
            return null;
        }

        const {activeFilters} = this.props.items;
        const totalResults = this.props.items._meta.total;
        const pageSize = this.props.items._meta.max_results;
        const pageCount = Math.ceil(totalResults / pageSize);

        const {formConfig, renderRow} = this.props;

        const formConfigForFilters = getFormGroupForFiltering(formConfig);
        const fieldsList = getFormFieldsRecursive(formConfig.form);

        const sortOptions: Array<ISortFields> = [
            ...fieldsList.map(({label, field}) => ({label, field})),
            {
                label: gettext('Last updated'),
                field: '_updated',
            },
            {
                label: gettext('First created'),
                field: '_created',
            },
        ];

        const getContents = () => {
            if (this.props.items._items.length === 0) {
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
                                {gettext('There are no items yet.')}
                            </ListItemColumn>
                        </ListItem>
                    );
                }
            } else {
                return (
                    <div
                        data-test-id="list-page--items"
                        className="sd-list-item-group sd-list-item-group--space-between-items"
                    >
                        {
                            this.props.items._items.map(
                                (item) => renderRow(item._id, item, this),
                            )
                        }
                    </div>
                );
            }
        };

        return (
            <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                <div className="subnav">
                    <div style={{
                        display: 'flex',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}>
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

                        <div style={{display: 'flex', marginLeft: 'auto'}}>
                            <SortBar
                                sortOptions={sortOptions}
                                selected={this.props.items.activeSortOption}
                                itemsCount={this.props.items._meta.total}
                                onSortOptionChange={this.props.items.sort}
                            />

                            {
                                this.props.disallowCreatingNewItem === true ? null : (
                                    <div>
                                        <Button
                                            onClick={this.openNewItemForm}
                                            className="sd-create-btn dropdown-toggle"
                                            icon="icon-plus-large"
                                            data-test-id="list-page--add-item"
                                        >
                                            <span className="circle" />
                                        </Button>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
                <PageContainer>
                    {
                        this.state.filtersOpen ? (
                            <PageContainerItem data-test-id="list-page--filters-form">
                                <SidePanel side="left" width={240}>
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
                                            <form onSubmit={(event) => {
                                                event.preventDefault();
                                                this.filter();
                                            }}>
                                                <FormViewEdit
                                                    item={this.state.filterValues}
                                                    formConfig={formConfigForFilters}
                                                    editMode={true}
                                                    issues={{}}
                                                    handleFieldChange={this.handleFilterFieldChange}
                                                />
                                                <button
                                                    className="btn btn--primary btn--expanded"
                                                    type="submit"
                                                    data-test-id="filters-submit"
                                                >
                                                    {gettext('Filter')}
                                                </button>
                                            </form>
                                        </SidePanelContentBlock>
                                    </SidePanelContent>
                                </SidePanel>
                            </PageContainerItem>
                        ) : null
                    }
                    <PageContainerItem shrink>
                        <div style={{margin: 20}}>
                            {
                                this.props.items._items.length === 0 ? null : (
                                    <div style={{textAlign: 'center', marginTop: -20}}>
                                        <ReactPaginate
                                            previousLabel={gettext('prev')}
                                            nextLabel={gettext('next')}
                                            pageCount={pageCount}
                                            marginPagesDisplayed={2}
                                            pageRangeDisplayed={5}
                                            onPageChange={({selected}) => {
                                                this.props.items.goToPage(selected + 1);
                                            }}
                                            initialPage={this.props.items._meta.page - 1}
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
                                            Object.keys(activeFilters).map((fieldName, i) => {
                                                const filterValuePreview = getFormFieldPreviewComponent(
                                                    this.props.items.activeFilters,
                                                    getFormFieldsFlat(formConfigForFilters).find(
                                                        ({field}) => field === fieldName,
                                                    ),
                                                );

                                                return (
                                                    <TagLabel
                                                        key={i}
                                                        onRemove={() => {
                                                            this.removeFilter(fieldName);
                                                        }}
                                                    >
                                                        {fieldName}:{' '}
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
                                    formConfig={formConfig}
                                    editMode={true}
                                    onEditModeChange={() => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            newItem: null,
                                        }));
                                    }}
                                    item={this.state.newItem}
                                    onSave={(item: T) => this.props.items.create(item).then((res) => {
                                        this.props.notify.success(gettext('The item has been created.'));
                                        this.closeNewItemForm();
                                        this.openPreview(res._id);
                                    })}
                                    onClose={this.closeNewItemForm}
                                    onCancel={this.closeNewItemForm}
                                />
                            </PageContainerItem>
                        ) : this.state.editItemId != null ? (
                            <PageContainerItem data-test-id="list-page--view-edit">
                                <GenericListPageItemViewEdit
                                    key={'edit' + this.state.editItemId}
                                    editMode={true}
                                    onEditModeChange={() => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            editItemId: null,
                                        }));
                                    }}
                                    operation="editing"
                                    formConfig={formConfig}
                                    item={
                                        this.props.items._items.find(({_id}) => _id === this.state.editItemId)
                                    }
                                    onSave={(nextItem) => this.props.items.update(nextItem).then(() => {
                                        this.props.notify.success(gettext('The item has been updated.'));
                                    })}
                                    onClose={this.closePreview}
                                />
                            </PageContainerItem>
                        ) : this.state.previewItemId != null ? (
                            <PageContainerItem data-test-id="list-page--view-edit">
                                <GenericListPageItemViewEdit
                                    key={'preview' + this.state.previewItemId}
                                    editMode={false}
                                    onEditModeChange={() => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            editItemId: prevState.previewItemId,
                                        }));
                                    }}
                                    operation="editing"
                                    formConfig={formConfig}
                                    item={
                                        this.props.items._items.find(({_id}) => _id === this.state.previewItemId)
                                    }
                                    onSave={(nextItem) => this.props.items.update(nextItem)}
                                    onClose={this.closePreview}
                                />
                            </PageContainerItem>
                        ) : null
                    }
                </PageContainer>
            </div>
        );
    }
}

export const getGenericListPageComponent = <T extends IBaseRestApiResponse>(resource: string) =>
    connectServices<IPropsGenericForm<T>>(
        connectCrudManager<IPropsGenericForm<T>, IPropsConnected<T>, T>(
            GenericListPageComponent,
            'items',
            resource,
        )
        , ['modal', '$rootScope', 'notify'],
    );
