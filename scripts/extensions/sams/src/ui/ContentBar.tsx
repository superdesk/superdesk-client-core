import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    right?: boolean;
}

export class ContentBar extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'subnav__content-bar',
            {'subnav__content-bar--right': this.props.right === true},
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
