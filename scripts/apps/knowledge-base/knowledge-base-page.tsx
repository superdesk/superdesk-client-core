import React from 'react';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'core/components/ListItem';
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
import {SortBar} from 'core/ui/components/SortBar';
import {Dropdown2} from 'superdesk-ui-framework';

const originalItems = [
    {
        id: "1",
        title: "Biscuits Fossier",
        language: "English",
        value: "Biscuits Fossier is a Reims, France based manufacturer of biscuits, \
        gingerbread, sweets and marsipan-based confectionery.",
    },
    {
        id: "2",
        title: "Délifrance",
        language: "Portuguese",
        value: "Biscuits Fossier is a Reims, France based manufacturer of biscuits, \
        gingerbread, sweets and marsipan-based confectionery.",
    },
    {
        id: "3",
        title: "Biscuits Fossier",
        language: "English",
        value: `Délifrance is a bakery company that produces "French style" bakery, \
        savoury and snacking products in over 100 countries on five continents. It has \
        been in operation since 1983. The sister company of Délifrance is Grands Moulins \
        de Paris, which is a major French milling company and supplies 100% of the flour \
        used in Délifrance's products.`,
    },
    {
        id: "4",
        title: "Paul",
        language: "French",
        value: "Paul is a French chain of bakery/café restaurants established in 1889 in the town of Croix, \
        in Nord, by Charlemagne Mayot. It specializes in serving French products including breads, crêpes, \
        sandwiches, macarons, soups, cakes, pastries, coffee, wine, and beer.",
    },
];

const testSortOptions = [
    {
        id: '1',
        label: 'Name',
    },
    {
        id: '2',
        label: 'Description',
    },
    {
        id: '3',
        label: 'Last updated',
    },
];

const testCurrentSortOption = '2';
const testItemsCount = 34;
const testCurrentSortDirection = 'descending';

interface IState {
    allItems: Array<any>;
    itemInPreview?: string;
    newItem: null | {[key: string]: any};
    filtersOpen: boolean;
    filterValues: {[key: string]: any};
    searchValue: string;
}

const formConfig: IFormGroup = {
    direction: 'vertical',
    type: 'inline',
    form: [
        {
            label : gettext('Title'),
            type: 'single_line_text',
            field: 'title',
        },
        {
            label : gettext('Language'),
            type: 'single_line_text',
            field: 'language',
        },
        {
            label : gettext('Value'),
            type: 'single_line_text',
            field: 'value',
        },
    ],
};

export class KnowledgeBasePage extends React.Component<void, IState> {
    constructor(props) {
        super(props);

        this.state = {
            allItems: originalItems,
            itemInPreview: null,
            newItem: null,
            filtersOpen: false,
            filterValues: {},
            searchValue: '',
        };

        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setFiltersVisibility = this.setFiltersVisibility.bind(this);
        this.updateItemInEditMode = this.updateItemInEditMode.bind(this);
        this.handleFilterFieldChange = this.handleFilterFieldChange.bind(this);
        this.filterItems = this.filterItems.bind(this);
        this.addItem = this.addItem.bind(this);
    }
    openPreview(id) {
        this.setState({
            itemInPreview: id,
        });
    }
    closePreview() {
        this.setState({itemInPreview: null});
    }
    updateItemInEditMode(nextItem): Promise<void> {
        return new Promise((resolve) => {
            this.setState({
                ...this.state,
                allItems: this.state.allItems.map(
                    (currentItem) => currentItem.id === nextItem.id ? nextItem : currentItem,
                ),
            }, () => {
                resolve();
            });
        });
    }
    handleFilterFieldChange(field, nextValue) {
        this.setState({
            filterValues: {
                ...this.state.filterValues,
                [field]: nextValue,
            },
        });
    }
    filterItems() {
        const {filterValues} = this.state;

        this.setState({
            allItems: originalItems.filter((item) => {
                return Object.keys(filterValues).every((field) => {
                    return item[field].toLowerCase().includes(filterValues[field].toLowerCase());
                });
            }),
        });
    }
    setFiltersVisibility(open: boolean) {
        this.setState({filtersOpen: open});
    }
    addItem() {
        this.setState({newItem: {}});
    }
    render() {
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
                        onSearch={() => { throw new Error('Not implemented yet'); }}
                    />

                    <SortBar
                        sortOptions={testSortOptions}
                        selectedSortOptionId={testCurrentSortOption}
                        direction={testCurrentSortDirection}
                        itemsCount={testItemsCount}
                        onSortOptionChange={() => {
                            console.log('sort option changed');
                        }}
                        onSortDirectionChange={() => {
                            console.log('sort direction changed');
                        }}
                    />

                    <Button
                        onClick={this.addItem}
                        className="sd-create-btn dropdown-toggle"
                        icon="icon-plus-large"
                    >
                        <span className="circle"></span>
                    </Button>
                </div>
                <PageContainer>
                    {
                        this.state.filtersOpen ? (
                            <PageContainerItem>
                                <SidePanel side='left' width={240}>
                                    <SidePanelHeader>
                                        <SidePanelHeading>{gettext('Refine search')}</SidePanelHeading>
                                        <SidePanelTools>
                                            <button
                                                className="icn-btn"
                                                onClick={() => this.setFiltersVisibility(false)}
                                            >
                                                <i className="icon-close-small"></i>
                                            </button>
                                        </SidePanelTools>
                                    </SidePanelHeader>
                                    <SidePanelContent>
                                        <SidePanelContentBlock>
                                            <FormViewEdit
                                                item={{}}
                                                formConfig={formConfig}
                                                editMode={true}
                                                handleFieldChange={this.handleFilterFieldChange}
                                            />
                                            <button
                                                onClick={this.filterItems}
                                                className="btn btn--primary btn--expanded"
                                            >
                                                {gettext('Filter')}
                                            </button>
                                        </SidePanelContentBlock>
                                    </SidePanelContent>
                                </SidePanel>
                            </PageContainerItem>
                        ) : null
                    }
                    <PageContainerItem shrink>
                        <div style={{margin: 20}}>
                            {
                                this.state.allItems.map((item, i) => (
                                    <ListItem onClick={() => this.openPreview(item.id)} key={item.id}>
                                        <ListItemColumn>
                                            {item.title}
                                        </ListItemColumn>
                                        <ListItemColumn>
                                            {item.language}
                                        </ListItemColumn>
                                        <ListItemColumn ellipsisAndGrow noBorder>
                                            {item.value}
                                        </ListItemColumn>
                                        <ListItemActionsMenu>
                                            <button id={"knowledgebaseitem" + i}>
                                                <i className="icon-dots-vertical" />
                                            </button>
                                            <Dropdown2
                                                triggerSelector={"#knowledgebaseitem" + i}
                                                placement="left-start"
                                            >
                                                <ul
                                                    className="dropdown__menu"
                                                    style={{ display: "block", position: "static" }}
                                                >
                                                    <li>
                                                        <div className="dropdown__menu-label">{gettext('Actions')}</div>
                                                    </li>
                                                    <li className="dropdown__menu-divider" />
                                                    <li>
                                                        <a title="Edit">
                                                        <i className="icon-pencil" />
                                                        <span style={{ display: "inline" }}>Button 1</span>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a title="Edit in new Window">
                                                        <i className="icon-pencil" />
                                                        <span style={{ display: "inline" }}>Button 2</span>
                                                        </a>
                                                    </li>
                                                </ul>
                                            </Dropdown2>
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
                                    operation='editing'
                                    formConfig={formConfig}
                                    item={this.state.allItems.find(({id}) => id === this.state.itemInPreview)}
                                    onSave={this.updateItemInEditMode}
                                    onClose={this.closePreview}
                                />
                            </PageContainerItem>
                        ) : null
                    }

                    {
                        this.state.newItem != null ? (
                            <PageContainerItem>
                                <KnowledgeItemViewEdit
                                    operation='creation'
                                    formConfig={formConfig}
                                    item={this.state.newItem}
                                    onSave={(item) => new Promise((resolve) => {
                                        // do api call and set newItem to null
                                        this.setState({newItem: null}, () => { resolve(); });
                                    })}
                                    onClose={() => {
                                        this.setState({newItem: null});
                                    }}
                                    onCancel={() => {
                                        this.setState({newItem: null});
                                    }}
                                />
                            </PageContainerItem>
                        ) : null
                    }
                </PageContainer>
            </div>
        );
    }
}
