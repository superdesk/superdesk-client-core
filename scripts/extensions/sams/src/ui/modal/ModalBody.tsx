import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    noPadding?: boolean;
    addMinHeight?: boolean;
}

export class ModalBody extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'modal__body',
            {
                'modal__body--add-min-height': this.props.addMinHeight,
                'modal__body--no-padding': this.props.noPadding,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
