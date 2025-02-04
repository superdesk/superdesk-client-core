import * as React from 'react';
import classNames from 'classnames';

import {ModalHeading} from './ModalHeading';

interface IProps {
    children?: React.ReactNode;
    onClose?(): void;
    flex?: boolean;
    text?: string;
}

export class ModalHeader extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'modal__header',
            {'modal__header--flex': this.props.flex},
        );

        return (
            <div className={classes}>
                {this.props.onClose == null ? null : (
                    <button className="modal__close pull-right" onClick={this.props.onClose}>
                        <i className="icon-close-small" />
                    </button>
                )}
                {this.props.text && (
                    <ModalHeading>
                        {this.props.text}
                    </ModalHeading>
                )}
                {this.props.children}
            </div>
        );
    }
}
