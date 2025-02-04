import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    multiL?: boolean;
    multiR?: boolean;
    singleR?: boolean;
}

export class GridItemFooterBlock extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-grid-item__footer-block',
            {
                'sd-grid-item__footer-block--multi-l': this.props.multiL,
                'sd-grid-item__footer-block--multi-r': this.props.multiR,
                'sd-grid-item__footer-block--single-r': this.props.singleR,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
