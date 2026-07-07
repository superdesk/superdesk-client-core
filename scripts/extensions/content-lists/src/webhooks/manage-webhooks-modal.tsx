import * as React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {
    BoxedList,
    Button,
    ButtonGroup,
    CreateButton,
    Dropdown,
    EmptyState,
    Loader,
    Modal,
    NavButton,
    SearchBar,
    SubNav,
} from 'superdesk-ui-framework/react';
import {deleteWebhook, fetchWebhooks} from '../api';
import {IContentList, IWebhook} from '../interfaces';
import {superdesk} from '../superdesk';
import {EditWebhookPanel} from './edit-webhook-panel';
import {WebhookItem} from './webhook-item';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;
const {getClass} = superdesk.utilities.CSS;

type IEnabledFilter = 'all' | 'enabled' | 'disabled';

interface IProps {
    lists: Array<IContentList>;
    closeModal(): void;
}

interface IState {
    webhooks: Array<IWebhook> | null;
    searchString: string;
    filter: IEnabledFilter;
    editorOpen: boolean;
    selectedWebhook: IWebhook | null;
}

function getFilterLabel(filter: IEnabledFilter): string {
    switch (filter) {
        case 'all':
            return gettext('All');
        case 'enabled':
            return gettext('Enabled');
        case 'disabled':
            return gettext('Disabled');
    }
}

const FILTERS: Array<IEnabledFilter> = ['all', 'enabled', 'disabled'];

export class ManageWebhooksModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            webhooks: null,
            searchString: '',
            filter: 'all',
            editorOpen: false,
            selectedWebhook: null,
        };

        this.reload = this.reload.bind(this);
        this.removeWebhook = this.removeWebhook.bind(this);
    }

    componentDidMount() {
        this.reload();
    }

    reload(): Promise<void> {
        return fetchWebhooks()
            .then((webhooks) => {
                this.setState({webhooks});
            })
            .catch(() => {
                notify.error(gettext('Could not load webhooks.'));
            });
    }

    removeWebhook(webhook: IWebhook) {
        superdesk.ui.confirm(gettext('Please confirm you want to delete the webhook.'))
            .then((confirmed) => {
                if (!confirmed) {
                    return;
                }

                deleteWebhook(webhook)
                    .then(() => this.reload())
                    .catch(() => {
                        notify.error(gettext('Could not delete the webhook.'));
                    });
            });
    }

    getVisibleWebhooks(): Array<IWebhook> {
        const {webhooks, searchString, filter} = this.state;

        const searchLowercase = searchString.trim().toLowerCase();

        return (webhooks ?? [])
            .filter((webhook) => {
                const enabled = webhook.enabled !== false;

                if (filter === 'enabled' && !enabled) {
                    return false;
                }

                if (filter === 'disabled' && enabled) {
                    return false;
                }

                return searchLowercase.length < 1 || webhook.url.toLowerCase().includes(searchLowercase);
            })
            .sort((a, b) => {
                const aEnabled = a.enabled !== false ? 0 : 1;
                const bEnabled = b.enabled !== false ? 0 : 1;

                return aEnabled - bEnabled || a.url.localeCompare(b.url);
            });
    }

    render() {
        const {webhooks, filter, editorOpen, selectedWebhook} = this.state;

        const visibleWebhooks = this.getVisibleWebhooks();

        return (
            <Modal
                visible
                size="x-large"
                closeOnEscape
                contentBg="medium"
                contentPadding="none"
                headerTemplate={gettext('Manage Webhooks')}
                onHide={this.props.closeModal}
                footerTemplate={(
                    <Button
                        text={gettext('Close')}
                        onClick={this.props.closeModal}
                    />
                )}
            >
                <div className={getClass('manage-webhooks')} data-test-id="manage-webhooks">
                    {
                        webhooks == null
                            ? <Loader overlay />
                            : (
                                <Layout.LayoutContainer fullHeight>
                                    <Layout.HeaderPanel>
                                        <SubNav>
                                            <SearchBar
                                                placeholder={gettext('Search')}
                                                onSubmit={(value: string) => {
                                                    this.setState({searchString: value});
                                                }}
                                                searchOptions={{searchOnType: true, searchDelay: 300}}
                                            />
                                            <ButtonGroup align="end" spaces="no-space">
                                                <Dropdown
                                                    items={[{
                                                        type: 'group',
                                                        label: gettext('Filter'),
                                                        items: [
                                                            'divider',
                                                            ...FILTERS.map((filterOption) => ({
                                                                label: getFilterLabel(filterOption),
                                                                active: filterOption === filter,
                                                                onSelect: () => {
                                                                    this.setState({filter: filterOption});
                                                                },
                                                            })),
                                                        ],
                                                    }]}
                                                >
                                                    <NavButton
                                                        text={getFilterLabel(filter)}
                                                        onClick={() => false}
                                                    />
                                                </Dropdown>
                                                <CreateButton
                                                    ariaValue={gettext('Create new webhook')}
                                                    onClick={() => {
                                                        this.setState({editorOpen: true, selectedWebhook: null});
                                                    }}
                                                />
                                            </ButtonGroup>
                                        </SubNav>
                                    </Layout.HeaderPanel>
                                    <Layout.MainPanel>
                                        {
                                            visibleWebhooks.length < 1
                                                ? (
                                                    <EmptyState
                                                        size="small"
                                                        title={gettext('There are no webhooks yet')}
                                                    />
                                                )
                                                : (
                                                    <BoxedList>
                                                        {
                                                            visibleWebhooks.map((webhook) => (
                                                                <WebhookItem
                                                                    key={webhook._id}
                                                                    webhook={webhook}
                                                                    selected={
                                                                        editorOpen
                                                                        && selectedWebhook?._id === webhook._id
                                                                    }
                                                                    onEdit={
                                                                        editorOpen
                                                                            ? null
                                                                            : () => {
                                                                                this.setState({
                                                                                    editorOpen: true,
                                                                                    selectedWebhook: webhook,
                                                                                });
                                                                            }
                                                                    }
                                                                    onDelete={() => {
                                                                        this.removeWebhook(webhook);
                                                                    }}
                                                                />
                                                            ))
                                                        }
                                                    </BoxedList>
                                                )
                                        }
                                    </Layout.MainPanel>
                                    <Layout.RightPanel open={editorOpen}>
                                        {
                                            editorOpen && (
                                                <EditWebhookPanel
                                                    key={selectedWebhook?._id ?? 'new'}
                                                    webhook={selectedWebhook}
                                                    lists={this.props.lists}
                                                    onClose={() => {
                                                        this.setState({editorOpen: false, selectedWebhook: null});
                                                    }}
                                                    onSaved={this.reload}
                                                />
                                            )
                                        }
                                    </Layout.RightPanel>
                                </Layout.LayoutContainer>
                            )
                    }
                </div>
            </Modal>
        );
    }
}
