import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    collapsed?: boolean;
    expanded?: boolean;
    parentItem: React.ReactNode;
    shadow?: 1 | 2 | 3 | 4 | 5;
}

export class ListItemNested extends React.PureComponent<IProps> {
    render() {
        const containerClass = classNames(
            'sd-list-item-nested',
            {
                'sd-list-item-nested--collapsed': this.props.collapsed,
                'sd-list-item-nested--expanded': this.props.expanded,
            },
        );

        const childClass = classNames(
            'sd-list-item-nested__childs',
            {[`sd-shadow--z${this.props.shadow}`]: this.props.shadow},
        );

        return (
            <div className={containerClass}>
                {this.props.parentItem}
                <div className={childClass}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
