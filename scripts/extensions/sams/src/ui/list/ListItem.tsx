import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    noBg?: boolean;
    noHover?: boolean;
    shadow?: 1 | 2 | 3 | 4;
    activated?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    margin?: boolean;
    draggable?: boolean;
    selected?: boolean;
    active?: boolean;
    inactive?: boolean;
    grow?: boolean;
}

export class ListItem extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            this.props.className,
            'sd-list-item',
            {
                'sd-list-item--no-bg': this.props.noBg,
                'sd-list-item--no-hover': this.props.noHover,
                'sd-list-item--margin': this.props.margin,
                [`sd-shadow--z${this.props.shadow}`]: this.props.shadow,
                'sd-list-item--activated': this.props.activated,
                'sd-list-item--draggable': this.props.draggable,
                'sd-list-item--selected': this.props.selected,
                'sd-list-item--active': this.props.active,
                'sd-list-item--inactive': this.props.inactive,
                'sd-list-item--element-grow': this.props.grow,
            },
        );

        return (
            <div onClick={this.props.onClick} className={classes}>
                {this.props.children}
            </div>
        );
    }
}
