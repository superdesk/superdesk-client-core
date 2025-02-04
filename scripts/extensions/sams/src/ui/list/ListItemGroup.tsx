import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    className?: string;
    shadow?: 1 | 2 | 3 | 4 | 5;
    spaceBetweenItems?: boolean;
    margin?: boolean;
}

export class ListItemGroup extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            this.props.className,
            'sd-list-item-group',
            {
                'sd-list-item-group--space-between-items': this.props.spaceBetweenItems,
                'sd-list-item-group--margin': this.props.margin,
                [`sd-shadow--z${this.props.shadow}`]: this.props.shadow,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
