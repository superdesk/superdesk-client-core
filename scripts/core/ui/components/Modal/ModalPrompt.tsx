import React from 'react';
import Textarea from 'react-textarea-autosize';
import {gettext} from 'core/utils';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

interface IPropsModalPrompt {
    title: string;
    initialValue?: string;
    onSubmit(value: string): void;
    close(): void;
}

export class ModalPrompt extends React.Component<IPropsModalPrompt, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.updateValue = this.updateValue.bind(this);
        this.submitValue = this.submitValue.bind(this);

        this.state = {
            value: this.props.initialValue || '',
        };
    }

    updateValue(event) {
        this.setState({
            value: event.target.value,
        });
    }

    submitValue() {
        this.props.onSubmit(this.state.value);
    }

    render() {
        return (
            <Modal
                visible
                zIndex={1050}
                size="medium"
                position="top"
                headerTemplate={this.props.title}
                footerTemplate={
                    (
                        <ButtonGroup align="end">
                            <Button
                                type="default"
                                text={gettext('Cancel')}
                                onClick={this.props.close}
                            />
                            <Button
                                type="primary"
                                text={gettext('Submit')}
                                disabled={this.state.value.length < 1}
                                onClick={this.submitValue}
                            />
                        </ButtonGroup>
                    )
                }
            >
                <Textarea
                    value={this.state.value}
                    onChange={this.updateValue}
                    style={{maxHeight: 400, resize: 'none'}}
                />
            </Modal>
        );
    }
}
