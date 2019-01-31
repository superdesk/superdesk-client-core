import React from 'react';
import {ListItem, ListItemColumn} from 'core/components/ListItem';
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
import {IFormGroup} from './interfaces/form';

const dataz = [
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

interface IState {
    allItems: Array<any>;
    itemInPreview?: string;
    filtersOpen: boolean;
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
            allItems: dataz,
            itemInPreview: null,
            filtersOpen: true,
        };

        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.closeFilters = this.closeFilters.bind(this);
        this.updateItem = this.updateItem.bind(this);
    }
    openPreview(id) {
        this.setState({
            itemInPreview: id,
        });
    }
    closePreview() {
        this.setState({itemInPreview: null});
    }
    updateItem(nextItem): Promise<void> {
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
    closeFilters() {
        this.setState({filtersOpen: false});
    }
    render() {
        return (
            <PageContainer>
                {
                    !this.state.filtersOpen ? null : (
                        <PageContainerItem>
                            <SidePanel side='left' width={200}>
                                <SidePanelHeader>
                                    <SidePanelHeading>{gettext('Refine search')}</SidePanelHeading>
                                    <SidePanelTools>
                                        <button className="icn-btn" onClick={this.closeFilters}>
                                            <i className="icon-close-small"></i>
                                        </button>
                                    </SidePanelTools>
                                </SidePanelHeader>
                                <SidePanelContent>
                                    <SidePanelContentBlock>
                                        {/* TODO: */}
                                    </SidePanelContentBlock>
                                </SidePanelContent>
                            </SidePanel>
                        </PageContainerItem>
                    )
                }
                <PageContainerItem shrink>
                    <div style={{margin: 20}}>
                        {
                            this.state.allItems.map((item) => (
                                <ListItem onClick={() => this.openPreview(item.id)} key={item.id}>
                                    <ListItemColumn>
                                        {item.title}
                                    </ListItemColumn>
                                    <ListItemColumn>
                                        {item.language}
                                    </ListItemColumn>
                                    <ListItemColumn ellipsisAndGrow>
                                        {item.value}
                                    </ListItemColumn>
                                </ListItem>
                            ))
                        }
                    </div>
                </PageContainerItem>

                {
                    this.state.itemInPreview == null ? null : (
                        <PageContainerItem>
                            <KnowledgeItemViewEdit
                                formConfig={formConfig}
                                item={this.state.allItems.find(({id}) => id === this.state.itemInPreview)}
                                updateItem={this.updateItem}
                                onClose={this.closePreview}
                            />
                        </PageContainerItem>
                    )
                }
            </PageContainer>
        );
    }
}
