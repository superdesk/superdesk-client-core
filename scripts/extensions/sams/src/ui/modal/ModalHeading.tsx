import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    noGrow?: boolean;
}

export class ModalHeading extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'modal__heading',
            {
                'modal__heading--no-grow': this.props.noGrow === true,
            },
        );

        return (
            <h3 className={classes}>
                {this.props.children}
            </h3>
        );
    }
}
