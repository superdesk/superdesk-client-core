import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    right?: boolean;
}

export class PanelHeaderSlidingToolbar extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'subnav__sliding-toolbar',
            {
                'subnav__sliding-toolbar--right': this.props.right,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
