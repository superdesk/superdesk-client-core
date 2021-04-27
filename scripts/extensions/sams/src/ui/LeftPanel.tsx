import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    open?: boolean;
}

export class LeftPanel extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-main-content-grid__filter',
            {
                'open-filters': this.props.open === true,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
