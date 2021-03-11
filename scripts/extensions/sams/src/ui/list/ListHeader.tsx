import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    title?: string;
    marginTop?: boolean;
}

export class ListHeader extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'sd-list-header',
            {'sd-list-header--m-top': this.props.marginTop},
        );

        return (
            <div className={classes}>
                {!this.props.title ? null : (
                    <span className="sd-list-header__name">
                        {this.props.title}
                    </span>
                )}
                {this.props.children}
            </div>
        );
    }
}
