import React from 'react';

interface IProps {
    style?: React.CSSProperties;
}

export class ModalBody extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="modal__body" data-test-id="modal-body" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}
