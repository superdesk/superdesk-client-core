import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {gettext} from 'core/utils';

type IValue = boolean | undefined;

function stringToValue(str: string): IValue {
    if (str === 'yes') {
        return true;
    } else if (str === 'no') {
        return false;
    } else {
        return undefined;
    }
}

function valueToString(val: IValue): string {
    if (val === true) {
        return 'yes';
    } else if (val === false) {
        return 'no';
    } else {
        return '';
    }
}

export class YesNo extends React.Component<IInputType<boolean>> {
    render() {
        if (this.props.previewOutput) {
            return (
                <div data-test-id={`gform-output--${this.props.formField.field}`}>
                    {valueToString(this.props.value)}
                </div>
            );
        }

        return (
            <div
                className={
                    classNames(
                        'sd-line-input',
                        {
                            'sd-line-input--invalid': this.props.issues.length > 0,
                            'sd-line-input--required': this.props.formField.required === true,
                        },
                    )
                }
            >
                <label className="sd-line-input__label">{this.props.formField.label}</label>

                <select
                    disabled={this.props.disabled}
                    value={valueToString(this.props.value)}
                    className="sd-line-input__select"
                    onChange={(event) => {
                        this.props.onChange(stringToValue(event.target.value));
                    }}
                    data-test-id={`gform-input--${this.props.formField.field}`}
                >
                    <option value="" />
                    <option value="yes">{gettext('Yes')}</option>
                    <option value="no">{gettext('No')}</option>
                </select>

                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }

                { // Design does not allow showing errors and description at the same
                    this.props.issues.length < 1 && this.props.formField.description && (
                        <span className="sd-line-input__hint">{this.props.formField.description}</span>
                    )
                }
            </div>
        );
    }
}
