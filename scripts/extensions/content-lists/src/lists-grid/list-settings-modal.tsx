import * as React from 'react';
import {Button, Input, Modal} from 'superdesk-ui-framework/react';
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
    limit: number | null;
    description: string;
    saving: boolean;
}

export class ListSettingsModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            limit: props.list.limit ?? null,
            description: props.list.description ?? '',
            saving: false,
        };

        this.save = this.save.bind(this);
    }

    save() {
        const {limit, description} = this.state;

        this.setState({saving: true});

        updateList(this.props.list, {
            limit: limit != null && limit > 0 ? limit : null,
            description,
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
        const {limit, description, saving} = this.state;

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
                            disabled={saving}
                            onClick={this.save}
                        />
                    </React.Fragment>
                )}
            >
                <div data-test-id="content-list-settings">
                    <Input
                        type="number"
                        label={gettext('Number of articles limit')}
                        value={limit ?? undefined}
                        onChange={(value) => {
                            this.setState({limit: Number.isFinite(value) && value > 0 ? value : null});
                        }}
                        data-test-id="content-list-settings--limit"
                    />
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
            </Modal>
        );
    }
}
