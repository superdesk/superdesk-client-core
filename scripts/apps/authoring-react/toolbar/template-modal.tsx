import {sdApi} from 'api';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, ITemplate} from 'superdesk-api';
import {Alert, Button, Checkbox, Dropdown, Heading, Input, Modal, Option, Select} from 'superdesk-ui-framework/react';

interface IProps {
    item: IArticle;
    closeModal: () => void;
}

interface IState {
    templateName: string | null;
    deskTemplate: boolean;
    response: ITemplate | string | null;
    selectedDeskId: string | null;
}

export class TemplateModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            templateName: this.props.item.slugline,
            deskTemplate: true,
            response: null,
            selectedDeskId: sdApi.desks.getAllDesks().map((x) => x._id).toArray()[0],
        };
    }

    render(): JSX.Element {
        const availableDesks = sdApi.desks.getAllDesks().map((x) => x).toArray();

        return (
            <Modal
                visible
                onHide={() => this.props.closeModal()}
                size="medium"
                zIndex={1050}
                headerTemplate={gettext('Save as template')}
            >
                <Spacer v gap="16">
                    <Input
                        onChange={(value) => this.setState({
                            templateName: value,
                        })}
                        value={this.state.templateName}
                        type="text"
                        label={gettext('Template name')}
                    />
                    {
                        typeof this.state.response === 'string' && (
                            <Alert
                                margin="none"
                                size="small"
                                type="alert"
                            >
                                {this.state.response}
                            </Alert>
                        )
                    }
                    <Checkbox
                        label={{text: gettext('Desk template')}}
                        checked={this.state.deskTemplate}
                        onChange={() => this.setState({deskTemplate: !this.state.deskTemplate})}
                    />
                    {
                        this.state.deskTemplate && (
                            <Select
                                onChange={(value) => {
                                    this.setState({selectedDeskId: value});
                                }}
                                label={gettext('Desks')}
                                value={this.state.selectedDeskId}
                            >
                                {
                                    availableDesks.map(({_id, name}) => (
                                        <Option key={_id} value={_id}>{name}</Option>
                                    ))
                                }
                            </Select>
                        )
                    }
                    <Spacer h gap="8" justifyContent="end" noGrow>
                        <Button
                            text={gettext('Cancel')}
                            onClick={() => this.props.closeModal()}
                        />
                        <Button
                            type="primary"
                            text={gettext('Save')}
                            onClick={() => {
                                sdApi.templates.save(
                                    this.props.item,
                                    this.state.templateName,
                                    this.state.selectedDeskId,
                                )
                                    .then((response) => {
                                        this.setState({response: response});
                                        this.props.closeModal();
                                    })
                                    .catch((error) => this.setState({response: error.data._issues.is_public}));
                            }}
                        />
                    </Spacer>

                </Spacer>
            </Modal>
        );
    }
}
