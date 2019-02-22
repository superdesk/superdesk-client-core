import React from "react";
import classNames from 'classnames';
import {IInputType} from "../interfaces/input-types";

export class TextSingleLine extends React.Component<IInputType<string>> {
    render() {
        return (
            <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <input
                    type="text"
                    disabled={this.props.disabled}
                    value={this.props.value}
                    onChange={(event) => this.props.onChange(event.target.value)}
                    className="sd-line-input__input"
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
