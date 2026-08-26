import * as React from 'react';
import {Button, Input, Modal, Switch} from 'superdesk-ui-framework/react';
import {updateList} from '../api';
import {IContentList} from '../interfaces';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;

interface IProps {
    list: IContentList;
    closeModal(): void;
    onSaved(): Promise<void>;
}

interface IState {
    name: string;
    limit: number | null;
    description: string;
    enabled: boolean;
    saving: boolean;
}

export class ListSettingsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            name: props.list.name,
            limit: props.list.limit ?? null,
            description: props.list.description ?? '',
            enabled: props.list.enabled !== false,
            saving: false,
        };

        this.save = this.save.bind(this);
    }

    save() {
        const {name, limit, description, enabled} = this.state;

        if (name.trim().length < 1) {
            return;
        }

        this.setState({saving: true});

        updateList(this.props.list, {
            name: name.trim(),
            limit: limit != null && limit > 0 ? limit : null,
            description,
            enabled,
        })
            .then(() => this.props.onSaved())
            .then(() => {
                this.props.closeModal();
            })
            .catch(() => {
                this.setState({saving: false});
                notify.error(gettext('Could not save list settings.'));
            });
    }

    render() {
        const {name, limit, description, enabled, saving} = this.state;

        return (
            <Modal
                visible
                size="small"
                headerTemplate={gettext('List settings')}
                onHide={this.props.closeModal}
                footerTemplate={(
                    <React.Fragment>
                        <Button
                            text={gettext('Cancel')}
                            onClick={this.props.closeModal}
                        />
                        <Button
                            text={gettext('Save')}
                            type="primary"
                            disabled={saving || name.trim().length < 1}
                            onClick={this.save}
                        />
                    </React.Fragment>
                )}
            >
                <div data-test-id="content-list-settings">
                    <div className="form__row">
                        <Input
                            type="text"
                            label={gettext('Name')}
                            value={name}
                            required={true}
                            onChange={(value) => {
                                this.setState({name: value});
                            }}
                            data-test-id="content-list-settings--name"
                        />
                    </div>
                    <div className="form__row">
                        <Input
                            type="number"
                            label={gettext('Number of articles limit')}
                            value={limit ?? undefined}
                            onChange={(value) => {
                                this.setState({limit: Number.isFinite(value) && value > 0 ? value : null});
                            }}
                            data-test-id="content-list-settings--limit"
                        />
                    </div>
                    <div className="form__row">
                        <Input
                            type="text"
                            label={gettext('Description')}
                            value={description}
                            onChange={(value) => {
                                this.setState({description: value});
                            }}
                            data-test-id="content-list-settings--description"
                        />
                    </div>
                    <div className="form__row" data-test-id="content-list-settings--enabled">
                        <Switch
                            label={{content: gettext('Active')}}
                            value={enabled}
                            onChange={(nextValue) => {
                                this.setState({enabled: nextValue});
                            }}
                        />
                    </div>
                </div>
            </Modal>
        );
    }
}
