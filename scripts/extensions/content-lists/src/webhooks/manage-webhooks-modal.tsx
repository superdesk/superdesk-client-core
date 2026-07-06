import * as React from 'react';
import {Button, ButtonGroup, FormLabel, Loader, Modal, SubNav} from 'superdesk-ui-framework/react';
import {deleteWebhook, fetchWebhooks} from '../api';
import {IContentList, IWebhook} from '../interfaces';
import {superdesk} from '../superdesk';
import {EditWebhookPanel} from './edit-webhook-panel';
import {WebhookItem} from './webhook-item';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;

interface IProps {
    lists: Array<IContentList>;
    closeModal(): void;
}

interface IState {
    webhooks: Array<IWebhook> | null;
    editorOpen: boolean;
    selectedWebhook: IWebhook | null;
}

export class ManageWebhooksModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            webhooks: null,
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

    renderGroup(title: string, webhooks: Array<IWebhook>, emptyMessage: string) {
        const {editorOpen} = this.state;

        return (
            <div className="sd-margin-b--2">
                <FormLabel text={title} />
                {
                    webhooks.length < 1
                        ? <p className="sd-text--light">{emptyMessage}</p>
                        : webhooks.map((webhook) => (
                            <WebhookItem
                                key={webhook._id}
                                webhook={webhook}
                                lists={this.props.lists}
                                onEdit={
                                    editorOpen
                                        ? null
                                        : () => {
                                            this.setState({editorOpen: true, selectedWebhook: webhook});
                                        }
                                }
                                onDelete={() => {
                                    this.removeWebhook(webhook);
                                }}
                            />
                        ))
                }
            </div>
        );
    }

    render() {
        const {webhooks, editorOpen, selectedWebhook} = this.state;

        return (
            <Modal
                visible
                size="large"
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
                <div
                    style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '40vh'}}
                    data-test-id="manage-webhooks"
                >
                    <SubNav>
                        <ButtonGroup align="end">
                            {
                                !editorOpen && (
                                    <Button
                                        text={gettext('Add New Webhook')}
                                        type="primary"
                                        icon="plus-sign"
                                        onClick={() => {
                                            this.setState({editorOpen: true, selectedWebhook: null});
                                        }}
                                    />
                                )
                            }
                        </ButtonGroup>
                    </SubNav>
                    {
                        webhooks == null
                            ? (
                                <div style={{position: 'relative', flexGrow: 1}}>
                                    <Loader overlay />
                                </div>
                            )
                            : (
                                <div style={{display: 'flex', flexGrow: 1, minHeight: 0}}>
                                    <div style={{flexGrow: 1, overflowY: 'auto', padding: '1.6rem'}}>
                                        {
                                            this.renderGroup(
                                                gettext('Enabled webhooks'),
                                                webhooks.filter((webhook) => webhook.enabled !== false),
                                                gettext('There are no enabled webhooks'),
                                            )
                                        }
                                        {
                                            this.renderGroup(
                                                gettext('Disabled webhooks'),
                                                webhooks.filter((webhook) => webhook.enabled === false),
                                                gettext('There are no disabled webhooks'),
                                            )
                                        }
                                    </div>
                                    {
                                        editorOpen && (
                                            <div
                                                style={{
                                                    width: '36rem',
                                                    flexShrink: 0,
                                                    borderInlineStart: '1px solid var(--sd-colour-line--medium)',
                                                    background: 'var(--sd-colour-panel-bg--000)',
                                                }}
                                            >
                                                <EditWebhookPanel
                                                    key={selectedWebhook?._id ?? 'new'}
                                                    webhook={selectedWebhook}
                                                    lists={this.props.lists}
                                                    onClose={() => {
                                                        this.setState({editorOpen: false, selectedWebhook: null});
                                                    }}
                                                    onSaved={this.reload}
                                                />
                                            </div>
                                        )
                                    }
                                </div>
                            )
                    }
                </div>
            </Modal>
        );
    }
}
