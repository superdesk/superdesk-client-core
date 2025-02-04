import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    rows?: boolean;
}

export class FormGroup extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'form__group',
            {
                'form__group--rows': this.props.rows,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
