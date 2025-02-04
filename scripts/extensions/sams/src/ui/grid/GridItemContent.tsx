import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    scrollable?: boolean;
}

export class GridItemContent extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-item__content',
            {'sd-grid-item__content--scrollable': this.props.scrollable},
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
