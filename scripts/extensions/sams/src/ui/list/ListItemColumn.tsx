import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    grow?: boolean;
    noBorder?: boolean;
    noPadding?: boolean;
    hasCheck?: boolean;
    checked?: boolean;
    largePadding?: boolean;
    noRightPadding?: boolean;
    shrink?: boolean;
}

export class ListItemColumn extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-list-item__column',
            {
                'sd-list-item__column--grow': this.props.grow,
                'sd-list-item__column--no-border': this.props.noBorder,
                'sd-list-item__column--no-padding': this.props.noPadding,
                'sd-list-item__column--has-check': this.props.hasCheck,
                'sd-list-item__column--checked': this.props.checked,
                'sd-list-item__column--large-padding': this.props.largePadding,
                'sd-list-item__column--no-right-padding': this.props.noRightPadding,
                'sd-list-item__column--shrink': this.props.shrink,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
