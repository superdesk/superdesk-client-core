import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    className?: string;
    grow?: boolean;
    right?: boolean;
}

export class PanelContentBlockInner extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'side-panel__content-block-inner',
            this.props.className,
            {
                'side-panel__content-block-inner--grow': this.props.grow,
                'side-panel__content-block-inner--right': this.props.right,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
