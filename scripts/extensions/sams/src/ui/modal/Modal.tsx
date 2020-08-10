import * as React from 'react';
import {Portal} from '../Portal';

interface IProps {
    id: string;
    size?: 'large' | 'x-large' | 'fill' | 'full-screen';
    closeOnEsc?: boolean;
    closeModal?(): void;
}

export class Modal extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleKeydown = this.handleKeydown.bind(this);
    }

    handleKeydown(event: KeyboardEvent) {
        if (event.code === 'Escape' && this.props.closeModal) {
            event.preventDefault();
            this.props.closeModal();
        }
    }

    componentDidMount() {
        if (this.props.closeOnEsc) {
            document.addEventListener('keydown', this.handleKeydown);
        }
    }

    componentWillUnmount() {
        if (this.props.closeOnEsc) {
            document.removeEventListener('keydown', this.handleKeydown);
        }
    }

    render() {
        const modalClass = this.props.size != null ?
            `modal modal--${this.props.size}` :
            'modal';

        return (
            <Portal id={this.props.id}>
                <div className="modal__backdrop fade in" />
                <div className={modalClass} style={{display: 'block'}}>
                    <div className="modal__dialog">
                        <div className="modal__content">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </Portal>
        );
    }
}
