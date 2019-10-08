import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {Checkbox} from '../../Form';
import {gettext} from 'core/utils';

export class CheckboxInput extends React.Component<IInputType<boolean>> {
    render() {
        if (this.props.previewOutput) {
            return <div>{this.props.value ? gettext('Yes') : gettext('No')}</div>;
        }

        return (
            <div className={
                classNames(
                    'sd-line-input',
                    {
                        'sd-line-input--invalid': this.props.issues.length > 0,
                        'sd-line-input--required': this.props.formField.required === true,
                    },
                )
            }>
                <Checkbox
                    value={this.props.value}
                    label={this.props.formField.label}
                    onChange={(field, value) => {
                        this.props.onChange(value === true);
                    }}
                    readOnly={this.props.disabled}
                />
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
