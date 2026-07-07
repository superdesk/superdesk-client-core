import * as React from 'react';
import {showModal} from '@sourcefabric/common';
import {
    ButtonGroup,
    CreateButton,
    Dropdown,
    EmptyState,
    GridItem,
    GridItemContent,
    GridList,
    IconButton,
    Input,
    NavButton,
    SearchBar,
    SubNav,
} from 'superdesk-ui-framework/react';
import {createList} from '../api';
import {IContentList} from '../interfaces';
import {superdesk} from '../superdesk';
import {ManageWebhooksModal} from '../webhooks/manage-webhooks-modal';
import {ListCard} from './list-card';
import {ListSettingsModal} from './list-settings-modal';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;

interface IProps {
    lists: Array<IContentList>;
    onOpenList(listId: string): void;
    refreshLists(): Promise<void>;
}

interface IState {
    searchString: string;
    newListName: string | null; // non-null while the "new list" card is open
    creatingList: boolean;
}

export class ListsGrid extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            searchString: '',
            newListName: null,
            creatingList: false,
        };

        this.createNewList = this.createNewList.bind(this);
        this.openWebhooksModal = this.openWebhooksModal.bind(this);
    }

    createNewList() {
        const name = (this.state.newListName ?? '').trim();

        if (name.length < 1 || this.state.creatingList) {
            return;
        }

        this.setState({creatingList: true});

        createList(name)
            .then(() => this.props.refreshLists())
            .then(() => {
                this.setState({newListName: null, creatingList: false});
            })
            .catch(() => {
                this.setState({creatingList: false});
                notify.error(gettext('Could not create the list.'));
            });
    }

    openWebhooksModal() {
        showModal(({closeModal}) => (
            <ManageWebhooksModal
                lists={this.props.lists}
                closeModal={closeModal}
            />
        ));
    }

    render() {
        const {lists} = this.props;
        const {searchString, newListName} = this.state;

        const filteredLists = searchString.trim().length < 1
            ? lists
            : lists.filter(
                (list) => list.name.toLowerCase().includes(searchString.trim().toLowerCase()),
            );

        const showEmptyState = lists.length < 1 && newListName == null;

        return (
            <div
                style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%'}}
                data-test-id="content-lists--grid"
            >
                <SubNav>
                    <SearchBar
                        placeholder={gettext('Search')}
                        onSubmit={(value: string) => {
                            this.setState({searchString: value});
                        }}
                        searchOptions={{searchOnType: true, searchDelay: 300}}
                    />
                    <ButtonGroup align="end" spaces="no-space">
                        <span data-test-id="content-lists--settings-menu">
                            <Dropdown
                                items={[
                                    {
                                        type: 'group',
                                        label: gettext('Settings'),
                                        items: [
                                            'divider',
                                            {
                                                icon: 'link',
                                                label: gettext('Webhooks'),
                                                onSelect: this.openWebhooksModal,
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <NavButton
                                    icon="settings"
                                    onClick={() => false}
                                />
                            </Dropdown>
                        </span>
                        <CreateButton
                            ariaValue={gettext('Create new content list')}
                            onClick={() => {
                                if (this.state.newListName == null) {
                                    this.setState({newListName: ''});
                                }
                            }}
                        />
                    </ButtonGroup>
                </SubNav>
                <div style={{flexGrow: 1, overflowY: 'auto'}}>
                    {
                        showEmptyState
                            ? (
                                <EmptyState
                                    size="large"
                                    title={gettext('No content lists yet')}
                                    description={gettext('Create the first one and add articles to it.')}
                                />
                            )
                            : (
                                <GridList size="large" gap="medium" margin="3">
                                    {
                                        newListName != null && (
                                            <GridItem>
                                                <GridItemContent>
                                                    <div
                                                        style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                                                        data-test-id="content-lists--new-list"
                                                    >
                                                        <Input
                                                            type="text"
                                                            value={newListName}
                                                            onChange={(value) => {
                                                                this.setState({newListName: value});
                                                            }}
                                                            label={gettext('List name')}
                                                            labelHidden={true}
                                                            required={true}
                                                            placeholder={gettext('List name')}
                                                            data-test-id="content-lists--new-list-name"
                                                        />
                                                        <IconButton
                                                            icon="ok"
                                                            ariaValue={gettext('Create list')}
                                                            onClick={this.createNewList}
                                                        />
                                                        <IconButton
                                                            icon="close-small"
                                                            ariaValue={gettext('Cancel')}
                                                            onClick={() => {
                                                                this.setState({newListName: null});
                                                            }}
                                                        />
                                                    </div>
                                                </GridItemContent>
                                            </GridItem>
                                        )
                                    }
                                    {
                                        filteredLists.map((list) => (
                                            <ListCard
                                                key={list._id}
                                                list={list}
                                                onOpenList={this.props.onOpenList}
                                                onOpenSettings={() => {
                                                    showModal(({closeModal}) => (
                                                        <ListSettingsModal
                                                            list={list}
                                                            closeModal={closeModal}
                                                            onSaved={this.props.refreshLists}
                                                        />
                                                    ));
                                                }}
                                                refreshLists={this.props.refreshLists}
                                            />
                                        ))
                                    }
                                </GridList>
                            )
                    }
                </div>
            </div>
        );
    }
}
