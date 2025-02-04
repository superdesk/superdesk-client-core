import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    onScroll?(event: React.UIEvent<HTMLDivElement>): void;
    className?: string;
}

export class GridList extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-list',
            {
                [`${this.props.className}`]: this.props.className != null,
            },
        );

        return (
            <div className={classes} onScroll={this.props.onScroll}>
                {this.props.children}
            </div>
        );
    }
}
