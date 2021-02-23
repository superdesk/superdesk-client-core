import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    state?: 'success' | 'error' | 'locked' | 'active' | 'idle' | 'dark-blue';
}

export class ListItemBorder extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-list-item__border',
            {[`sd-list-item__border--${this.props.state}`]: this.props.state != null},
        );

        return (
            <div className={classes} />
        );
    }
}
