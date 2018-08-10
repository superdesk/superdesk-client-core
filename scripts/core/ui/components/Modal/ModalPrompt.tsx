import React from 'react';
import PropTypes from 'prop-types';

import Textarea from 'react-textarea-autosize';

import {Modal} from './Modal';
import {ModalHeader} from './ModalHeader';
import {ModalBody} from './ModalBody';
import {ModalFooter} from './ModalFooter';

export class ModalPrompt extends React.Component<any, any> {
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
            <Modal>
                <ModalHeader>{this.props.title}</ModalHeader>

                <ModalBody>
                    <Textarea
                        value={this.state.value}
                        onChange={this.updateValue}
                        style={{maxHeight: 400, resize: 'none'}}
                    />
                </ModalBody>

                <ModalFooter>
                    <button className="btn" onClick={this.props.close}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary" onClick={this.submitValue}>{gettext('Submit')}</button>
                </ModalFooter>
            </Modal>
        );
    }
}

ModalPrompt.propTypes = {
    title: PropTypes.string.isRequired,
    initialValue: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
};