import React from 'react';
import {noop, omit} from 'lodash';
import ReactPaginate from 'react-paginate';

import {ListItem, ListItemActionsMenu} from 'core/components/ListItem';
import {PageContainer, PageContainerItem} from 'core/components/PageLayout';
import {KnowledgeItemViewEdit} from './knowledge-item-view-edit';
import {
    SidePanelHeader,
    SidePanel,
    SidePanelHeading,
    SidePanelTools,
    SidePanelContent,
    SidePanelContentBlock
} from 'core/components/SidePanel';
import {IFormGroup} from './generic-form/interfaces/form';
import {FormViewEdit} from './generic-form/from-group';
import {SearchBar} from 'core/ui/components';
import {Button} from 'core/ui/components/Nav';
import {SortBar, ISortFields} from 'core/ui/components/SortBar';
import {Positioner} from 'superdesk-ui-framework';
import {connectCrudManager, ICrudManager} from 'core/helpers/CrudManager';
import {TagLabel} from 'core/ui/components/TagLabel';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IDefaultApiFields} from '../../types/RestApi';
import {getFormGroupForFiltering} from './generic-form/get-form-group-for-filtering';
import {getFormFieldsRecursive} from './generic-form/form-field';

interface IState {
    itemInPreview?: string;
    newItem: null | {[key: string]: any};
    filtersOpen: boolean;
    filterValues: {[key: string]: any};
    searchValue: string;
    loading: boolean;
}

interface IProps<T extends IDefaultApiFields> {
    formConfig: IFormGroup;
    renderConceptItemRow(item: T): JSX.Element;

    // connected
    conceptItems?: ICrudManager<T>;
    modal?: any;
}

class GenericListPageComponent<T extends IDefaultApiFields> extends React.Component<IProps<T>, IState> {
    previewInEditMode: boolean;

    constructor(props) {
        super(props);

        this.state = {
            itemInPreview: null,
            newItem: null,
            filtersOpen: false,
            filterValues: {},
            searchValue: '',
            loading: true,
        };

        this.previewInEditMode = false;

        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setFiltersVisibility = this.setFiltersVisibility.bind(this);
        this.handleFilterFieldChange = this.handleFilterFieldChange.bind(this);
        this.openNewItemForm = this.openNewItemForm.bind(this);
        this.closeNewItemForm = this.closeNewItemForm.bind(this);
    }
    openPreview(id) {
        if (this.previewInEditMode === true) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t open a preview, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({
                itemInPreview: id,
            });
        }
    }
    closePreview() {
        this.setState({itemInPreview: null});
    }
    handleFilterFieldChange(field, nextValue, callback = noop) {
        this.setState({
            filterValues: {
                ...this.state.filterValues,
                [field]: nextValue,
            },
        }, callback);
    }
    executeFilters() {
        this.props.conceptItems.read(
            1,
            this.props.conceptItems.activeSortOption,
            this.state.filterValues,
        );
    }
    closeNewItemForm() {
        this.setState({newItem: null});
    }
    setFiltersVisibility(nextValue: boolean) {
        this.setState({filtersOpen: nextValue});
    }
    openNewItemForm() {
        if (this.previewInEditMode === true) {
            this.props.modal.alert({
                headerText: gettext('Warning'),
                bodyText: gettext(
                    'Can\'t add a new item, because another item is in edit mode.',
                ),
            });
        } else {
            this.setState({newItem: {}, itemInPreview: null});
        }
    }
    componentDidMount() {
        this.props.conceptItems.read(1);
    }
    render() {
        if (this.props.conceptItems._items == null) {
            // loading
            return null;
        }

        const {activeFilters} = this.props.conceptItems;
        const totalResults = this.props.conceptItems._meta.total;
        const pageSize = this.props.conceptItems._meta.max_results;
        const pageCount = Math.ceil(totalResults / pageSize);

        const {formConfig, renderConceptItemRow} = this.props;

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

        return (
            <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                <div className="subnav">
                    <Button
                        icon="icon-filter-large"
                        onClick={() => this.setFiltersVisibility(!this.state.filtersOpen)}
                        active={this.state.filtersOpen}
                        darker={true}
                    />

                    <SearchBar
                        value={this.state.searchValue}
                        allowCollapsed={false}
                        onSearch={(value) => {
                            this.handleFilterFieldChange('name', value, this.executeFilters);
                        }}
                    />

                    <SortBar
                        sortOptions={sortOptions}
                        selected={this.props.conceptItems.activeSortOption}
                        itemsCount={this.props.conceptItems._meta.total}
                        onSortOptionChange={this.props.conceptItems.sort}
                    />

                    <Button
                        onClick={this.openNewItemForm}
                        className="sd-create-btn dropdown-toggle"
                        icon="icon-plus-large"
                    >
                        <span className="circle" />
                    </Button>
                </div>
                <PageContainer>
                    {
                        this.state.filtersOpen ? (
                            <PageContainerItem>
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
                                                <button className="btn btn--primary btn--expanded" type="submit">
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
                            <div style={{textAlign: 'center', marginTop: -20}}>
                                <ReactPaginate
                                    previousLabel={gettext('prev')}
                                    nextLabel={gettext('next')}
                                    pageCount={pageCount}
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={5}
                                    onPageChange={({selected}) => {
                                        this.props.conceptItems.goToPage(selected + 1);
                                    }}
                                    initialPage={this.props.conceptItems._meta.page - 1}
                                    containerClassName={'bs-pagination'}
                                    activeClassName="active"
                                />
                            </div>
                            {
                                Object.keys(activeFilters).length < 1 ? null : (
                                    <div
                                        className="subnav"
                                        style={{background: 'transparent', boxShadow: 'none', marginTop: -20}}
                                    >
                                        {
                                            Object.keys(activeFilters).map((fieldName, i) => (
                                                <TagLabel
                                                    key={i}
                                                    onRemove={() => {
                                                        this.setState({
                                                            filterValues: omit(this.state.filterValues, [fieldName]),
                                                        });
                                                        this.props.conceptItems.removeFilter(fieldName);
                                                    }}
                                                >
                                                    {fieldName}:{' '}<strong>{activeFilters[fieldName]}</strong>
                                                </TagLabel>
                                            ))
                                        }
                                    </div>
                                )
                            }
                            {
                                this.props.conceptItems._items.map((item, i) => (
                                    <ListItem onClick={() => this.openPreview(item._id)} key={item._id}>
                                        {renderConceptItemRow(item)}
                                        <ListItemActionsMenu>
                                            <button id={'knowledgebaseitem' + i}>
                                                <i className="icon-dots-vertical" />
                                            </button>
                                            <Positioner
                                                triggerSelector={'#knowledgebaseitem' + i}
                                                placement="left-start"
                                                className="dropdown2"
                                            >
                                                <ul
                                                    className="dropdown__menu"
                                                    style={{display: 'block', position: 'static'}}
                                                >
                                                    <li>
                                                        <div className="dropdown__menu-label">{gettext('Actions')}</div>
                                                    </li>
                                                    <li className="dropdown__menu-divider" />
                                                    <li>
                                                        <button
                                                            onClick={() => this.props.conceptItems.delete(item) }
                                                            title="Edit"
                                                        >
                                                            <i className="icon-pencil" />
                                                            <span
                                                                style={{display: 'inline'}}
                                                            >
                                                                {gettext('Remove')}
                                                            </span>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </Positioner>
                                        </ListItemActionsMenu>
                                    </ListItem>
                                ))
                            }
                        </div>
                    </PageContainerItem>

                    {
                        this.state.itemInPreview != null ? (
                            <PageContainerItem>
                                <KnowledgeItemViewEdit
                                    onEditModeChange={(val) => {
                                        this.previewInEditMode = val;
                                    }}
                                    operation="editing"
                                    formConfig={formConfig}
                                    item={
                                        this.props.conceptItems._items.find(({_id}) => _id === this.state.itemInPreview)
                                    }
                                    onSave={(nextItem) => this.props.conceptItems.update(nextItem)}
                                    onClose={this.closePreview}
                                />
                            </PageContainerItem>
                        ) : null
                    }

                    {
                        this.state.newItem != null ? (
                            <PageContainerItem>
                                <KnowledgeItemViewEdit
                                    operation="creation"
                                    formConfig={formConfig}
                                    item={this.state.newItem}
                                    onSave={(item: T) => this.props.conceptItems.create({
                                        ...item,
                                        cpnat_type: 'cpnat:abstract',
                                    }).then((res) => {
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

export const getGenericListPageComponent = <T extends IDefaultApiFields>() => connectServices<IProps<T>>(
    connectCrudManager<IProps<T>, T>(
        GenericListPageComponent,
        'conceptItems',
        'concept_items',
    )
    , ['modal'],
);
