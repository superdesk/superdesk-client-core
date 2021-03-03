import * as React from 'react';

interface IProps {
    children: React.ReactNode;
}

export class ModalFooter extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="modal__footer">
                {this.props.children}
            </div>
        );
    }
}
