import * as React from 'react';
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
        const {webhook} = this.props;
        const {url, enabled, excludedLists, saving} = this.state;

        return (
            <div
                style={{display: 'flex', flexDirection: 'column', height: '100%'}}
                data-test-id="webhook-edit-panel"
            >
                <div className="side-panel__header side-panel__header--border-b">
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {webhook == null ? gettext('Add Webhook') : gettext('Edit Webhook')}
                    </h3>
                </div>
                <div style={{flexGrow: 1, overflowY: 'auto', padding: '1.6rem'}}>
                    <div className="sd-margin-b--2">
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
                    <div className="sd-margin-b--2">
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
                    <Switch
                        label={{content: gettext('Enabled')}}
                        value={enabled}
                        onChange={(value) => {
                            this.setState({enabled: value});
                        }}
                    />
                </div>
                <div className="side-panel__footer side-panel__footer--button-box">
                    <ButtonGroup align="end">
                        <Button
                            text={gettext('Cancel')}
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
                </div>
            </div>
        );
    }
}
