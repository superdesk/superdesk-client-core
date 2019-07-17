import React from 'react';
import {noop, omit} from 'lodash';
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
    SidePanelContentBlock
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
    preview: {
        itemId: string;
        editMode: boolean;
    };
    newItem: {
        item: null | {[key: string]: any},
        editMode: boolean;
    };
    filtersOpen: boolean;
    filterValues: {[key: string]: any};
    searchValue: string;
    loading: boolean;
}

interface IPropsConnected<T extends IBaseRestApiResponse> {
    items?: ICrudManager<T>;
}

export class GenericListPageComponent<T extends IBaseRestApiResponse>
    extends React.Component<IPropsGenericForm<T> & IPropsConnected<T>, IState>
    implements IGenericListPageComponent<T> {
    constructor(props) {
        super(props);

        this.state = {
            preview: {
                itemId: null,
                editMode: false,
            },
            newItem: {
                item: null,
                editMode: true,
            },
            filtersOpen: false,
            filterValues: {},
            searchValue: '',
            loading: true,
        };

        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setFiltersVisibility = this.setFiltersVisibility.bind(this);
        this.handleFilterFieldChange = this.handleFilterFieldChange.bind(this);
        this.openNewItemForm = this.openNewItemForm.bind(this);
        this.closeNewItemForm = this.closeNewItemForm.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
    }
    openPreview(id) {
        if (this.state.preview.editMode === true) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                preview: {
                    itemId: id,
                    editMode: false,
                },
            });
        }
    }
    removeFilter(fieldName: string) {
        this.setState((prevState) => ({
            ...prevState,
            filterValues: omit(prevState.filterValues, fieldName),
        }), () => {
            this.props.items.removeFilter(fieldName);
        });
    }
    deleteItem(item: T) {
        const deleteNow = () => this.props.items.delete(item);

        this.props.modal.confirm(gettext('Are you sure you want to delete this item?'))
            .then(() => {
                if (this.state.preview.editMode) {
                    this.props.modal.alert({
                        headerText: gettext('Warning'),
                        bodyText: gettext(
                            'The item in edit mode must be closed before you can delete.',
                        ),
                    });
                } else if (this.state.preview.itemId != null) {
                    this.setState({
                        preview: {itemId: null, editMode: false},
                    }, deleteNow);
                } else {
                    deleteNow();
                }
            });
    }
    startEditing(id: string) {
        if (this.state.preview.editMode === true) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t edit this item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                preview: {
                    itemId: id,
                    editMode: true,
                },
            });
        }
    }
    closePreview() {
        this.setState({
            preview: {
                itemId: null,
                editMode: false,
            },
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
    executeFilters() {
        const execute = () => {
            const {filterValues} = this.state;

            const formConfigForFilters = getFormGroupForFiltering(this.props.formConfig);

            const fieldTypesLookup = getFormFieldsFlat(formConfigForFilters)
                .reduce((accumulator, item) => ({...accumulator, ...{[item.field]: item.type}}), {});

            const filtersValidated = Object.keys(filterValues).reduce((accumulator, key) => {
                const value = filterValues[key];

                if (typeof value === 'string') {
                    let trimmedValue = value.trim();

                    if (trimmedValue.length > 0) {
                        accumulator[key] = trimmedValue;
                        return accumulator;
                    } else {
                        return accumulator;
                    }
                } else {
                    if (value !== undefined) {
                        accumulator[key] = value;
                    }

                    return accumulator;
                }
            }, {});

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

        if (this.state.preview.editMode) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'The item in edit mode must be closed before you can filter.',
                ),
            });
        } else if (this.state.preview.itemId != null) {
            this.setState({
                preview: {itemId: null, editMode: false},
            }, execute);
        } else {
            execute();
        }
    }
    closeNewItemForm() {
        this.setState({newItem: {item: null, editMode: false}});
    }
    setFiltersVisibility(nextValue: boolean) {
        this.setState({filtersOpen: nextValue});
    }
    openNewItemForm() {
        if (this.state.preview.editMode === true) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t add a new item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                newItem: {
                    item: {
                        ...getInitialValues(this.props.formConfig),
                        ...this.props.newItemTemplate == null ? {} : this.props.newItemTemplate,
                    },
                    editMode: true,
                },
                preview: {
                    itemId: null,
                    editMode: false,
                },
            });
        }
    }
    componentDidMount() {
        this.props.items.read(1, this.props.defaultSortOption);
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
                    <div data-test-id="list-page--items">
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
                                        value={this.state.searchValue}
                                        allowCollapsed={false}
                                        onSearch={(value) => {
                                            this.handleFilterFieldChange(
                                                this.props.fieldForSearch.field,
                                                value,
                                                this.executeFilters,
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
                                                this.executeFilters();
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
                        this.state.preview.itemId != null ? (
                            <PageContainerItem data-test-id="list-page--view-edit">
                                <GenericListPageItemViewEdit
                                    editMode={this.state.preview.editMode}
                                    onEditModeChange={(nextValue) => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            preview: {
                                                ...prevState.preview,
                                                editMode: nextValue,
                                            },
                                        }));
                                    }}
                                    operation="editing"
                                    formConfig={formConfig}
                                    item={
                                        this.props.items._items.find(({_id}) => _id === this.state.preview.itemId)
                                    }
                                    onSave={(nextItem) => this.props.items.update(nextItem)}
                                    onClose={this.closePreview}
                                />
                            </PageContainerItem>
                        ) : null
                    }

                    {
                        this.state.newItem.item != null ? (
                            <PageContainerItem data-test-id="list-page--new-item">
                                <GenericListPageItemViewEdit
                                    operation="creation"
                                    formConfig={formConfig}
                                    editMode={this.state.newItem.editMode}
                                    onEditModeChange={(nextValue: boolean) => {
                                        this.setState((prevState) => ({
                                            ...prevState,
                                            item: {...prevState.newItem, editMode: nextValue},
                                        }));
                                    }}
                                    item={this.state.newItem.item}
                                    onSave={(item: T) => this.props.items.create(item).then((res) => {
                                        this.closeNewItemForm();
                                        this.openPreview(res._id);
                                    })}
                                    onClose={this.closeNewItemForm}
                                    onCancel={this.closeNewItemForm}
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
        , ['modal'],
    );
