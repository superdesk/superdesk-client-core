import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    dark?: boolean;
}

export class GridList extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-list',
            {'dark-ui': this.props.dark},
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
