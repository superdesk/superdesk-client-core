import * as React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {Button, ButtonGroup, Input, MultiSelect, Switch} from 'superdesk-ui-framework/react';
import {createWebhook, updateWebhook} from '../api';
import {IContentList, IWebhook} from '../interfaces';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;

interface IProps {
    webhook: IWebhook | null; // null = creating a new one
    lists: Array<IContentList>;
    onClose(): void;
    onSaved(): Promise<void>;
}

interface IState {
    url: string;
    enabled: boolean;
    excludedLists: Array<IContentList>;
    saving: boolean;
}

export class EditWebhookPanel extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            url: props.webhook?.url ?? '',
            enabled: props.webhook?.enabled !== false,
            excludedLists: props.lists.filter(
                ({_id}) => (props.webhook?.excluded_lists ?? []).includes(_id),
            ),
            saving: false,
        };

        this.save = this.save.bind(this);
    }

    save() {
        const {webhook} = this.props;
        const {url, enabled, excludedLists} = this.state;

        const payload: Partial<IWebhook> = {
            url: url.trim(),
            enabled,
            excluded_lists: excludedLists.map(({_id}) => _id),
        };

        this.setState({saving: true});

        (webhook == null ? createWebhook(payload) : updateWebhook(webhook, payload))
            .then(() => this.props.onSaved())
            .then(() => {
                this.props.onClose();
            })
            .catch(() => {
                this.setState({saving: false});
                notify.error(gettext('Could not save the webhook.'));
            });
    }

    render() {
        const {url, enabled, excludedLists, saving} = this.state;

        return (
            <Layout.Panel side="right" data-test-id="webhook-edit-panel">
                <Layout.PanelHeader>
                    <Layout.PanelHeaderSlidingToolbar>
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                disabled={saving}
                                onClick={() => {
                                    this.props.onClose();
                                }}
                            />
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                disabled={url.trim().length < 1 || saving}
                                onClick={this.save}
                            />
                        </ButtonGroup>
                    </Layout.PanelHeaderSlidingToolbar>
                </Layout.PanelHeader>
                <Layout.PanelContent>
                    <Layout.PanelContentBlock>
                        <div className="form__row">
                            <Input
                                type="text"
                                label={gettext('URL')}
                                value={url}
                                required={true}
                                onChange={(value) => {
                                    this.setState({url: value});
                                }}
                                data-test-id="webhook-edit-panel--url"
                            />
                        </div>
                        <div className="form__row">
                            <MultiSelect
                                label={gettext('Excluded lists')}
                                info={gettext('The webhook fires for every content list except the selected ones.')}
                                options={this.props.lists}
                                value={excludedLists}
                                optionLabel={(list) => list.name}
                                onChange={(value) => {
                                    this.setState({excludedLists: value});
                                }}
                            />
                        </div>
                        <div className="form__row">
                            <Switch
                                label={{content: gettext('Enabled')}}
                                value={enabled}
                                onChange={(value) => {
                                    this.setState({enabled: value});
                                }}
                            />
                        </div>
                    </Layout.PanelContentBlock>
                </Layout.PanelContent>
            </Layout.Panel>
        );
    }
}
