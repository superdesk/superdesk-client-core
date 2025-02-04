import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    flex?: boolean;
    noPadding?: boolean;
    smallPadding?: boolean;
    sPadding?: boolean;
    lPadding?: boolean;
    xlPadding?: boolean;
    inner?: boolean;
    bordered?: boolean;
    flexNew?: boolean;
}

export class FormRow extends React.PureComponent<IProps> {
    render() {
        const classes = classNames(
            'form__row',
            {
                'form__row--flex': this.props.flex,
                'form__row--no-padding': this.props.noPadding,
                'form__row--small-padding': this.props.smallPadding,
                'form__row--s-padding': this.props.sPadding,
                'form__row--l-padding': this.props.lPadding,
                'form__row--xl-padding': this.props.xlPadding,
                'form__row--innder': this.props.inner,
                'form__row--bordered': this.props.bordered,
                'form__row--flex-NEW': this.props.flexNew,
            },
        );

        return (
            <div className={classes}>
                {this.props.children}
            </div>
        );
    }
}
