import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    className?: string;
    onlyChild?: boolean;
    wrap?: boolean;
}

export class ListItemRow extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-list-item__row',
            this.props.className,
            {
                'sd-list-item__row--only-child': this.props.onlyChild,
                'sd-list-item__row--wrap': this.props.wrap,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
