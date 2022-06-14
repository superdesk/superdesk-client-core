import React from 'react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IModalProps} from 'superdesk-api';

function getSizeClassName(size: IModalProps['size']) {
    if (size == null) {
        return null;
    } else if (size === 'large') {
        return 'modal--large';
    } else if (size === 'extra-large') {
        return 'modal--x-large';
    } else if (size === 'fill') {
        return 'modal--fill';
    } else if (size === 'full-screen') {
        return 'modal--fullscreen';
    } else {
        return assertNever(size);
    }
}

export class Modal extends React.PureComponent<IModalProps> {
    render() {
        return (
            <div data-test-id={this.props['data-test-id']}>
                <div className="modal__backdrop fade in" />
                <div className={'modal modal-react ' + getSizeClassName(this.props.size)} style={{display: 'block'}}>
                    <div className="modal__dialog">
                        <div className="modal__content">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
