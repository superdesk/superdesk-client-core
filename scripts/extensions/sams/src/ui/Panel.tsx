import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    side?: 'left' | 'right';
    background?: 'transparent' | 'light' | 'grey' | 'dark'; // defaults to light (white)
}

export class Panel extends React.PureComponent<IProps> {
    render() {
        const classes = classNames('side-panel', {
            [`side-panel--${this.props.side}`]: this.props.side,
            [`side-panel--${this.props.background}`]: this.props.background !== 'light' &&
                this.props.background !== undefined,
        });

        return (
            <div className="side-panel__container">
                <div className={classes}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
