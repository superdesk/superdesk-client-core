import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    row?: boolean;
}

export class ListItemActionMenu extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-list-item__action-menu',
            {'sd-list-item__action-menu--direction-row': this.props.row},
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
