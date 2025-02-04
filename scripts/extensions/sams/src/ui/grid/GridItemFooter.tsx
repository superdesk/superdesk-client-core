import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    light?: boolean;
    rightAlign?: boolean;
    spread?: boolean;
    padded?: boolean;
}

export class GridItemFooter extends React.PureComponent<IProps> {
    render() {
        const parentClasses = classNames(
            'sd-grid-item__footer',
            {
                'sd-grid-item__footer--light': this.props.light,
                'sd-grid-item__footer--right-align': this.props.rightAlign,
                'sd-grid-item__footer--spread': this.props.spread,
                'sd-grid-item__footer--padded': this.props.padded,
            },
        );

        return (
            <div className={parentClasses}>
                {this.props.children}
            </div>
        );
    }
}
