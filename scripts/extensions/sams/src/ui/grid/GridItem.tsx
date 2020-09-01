import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    onClick?(): void;
    selected?: boolean;
}

export class GridItem extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-item',
            {
                'sd-grid-item--with-click': this.props.onClick != null,
                'sd-grid-item--selected': this.props.selected,
            },
        );

        return (
            <div className={classes} onClick={this.props.onClick}>
                {this.props.children}
            </div>
        );
    }
}
