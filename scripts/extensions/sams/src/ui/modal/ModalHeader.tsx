import * as React from 'react';

interface IProps {
    children: React.ReactNode;
    onClose?(): void;
}

export class ModalHeader extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="modal__header">
                {this.props.onClose == null ? null : (
                    <button className="modal__close pull-right" onClick={this.props.onClose}>
                        <i className="icon-close-small" />
                    </button>
                )}
                <h3 className="modal__heading">
                    {this.props.children}
                </h3>
            </div>
        );
    }
}
