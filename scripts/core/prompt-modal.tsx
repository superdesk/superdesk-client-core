import React from 'react';
import {Button, Input, Modal, Spacer} from 'superdesk-ui-framework/react';
import {gettext} from './utils';

interface IProps {
    label: string;
    closeModal(result: {value: string | null}): void;
    okButtonText?: string;
    cancelButtonText?: string;
}

interface IState {
    value: string;
}

export class PromptModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            value: '',
        };
    }
    render() {
        return (
            <Modal
                position="top"
                visible
                onHide={() => this.props.closeModal({value: null})}
                footerTemplate={
                    (
                        <Spacer h gap="4" justifyContent="end" noWrap>
                            <Button
                                type="default"
                                text={this.props.cancelButtonText ?? gettext('Cancel')}
                                onClick={() => this.props.closeModal({value: null})}
                            />
                            <Button
                                type="primary"
                                text={this.props.okButtonText ?? gettext('Ok')}
                                onClick={() => {
                                    this.props.closeModal({value: this.state.value});
                                }}
                            />
                        </Spacer>
                    )
                }
            >
                <Input
                    label={this.props.label}
                    type="text"
                    value={this.state.value}
                    onChange={(value) => {
                        this.setState({value});
                    }}
                />
            </Modal>
        );
    }
}
